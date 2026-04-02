import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import { parseRawMessages } from './aiService.js';
import Statement from '../models/Statement.js';
import { OAuth2Client } from 'google-auth-library';

const activeConnections = new Map(); // userId -> connection object

const buildXoauth2Token = (user, accessToken) => {
    return Buffer.from([
        `user=${user}`,
        `auth=Bearer ${accessToken}`,
        '',
        ''
    ].join('\x01'), 'utf-8').toString('base64');
};

export const startUserEmailListener = async (user) => {
    if (!user || (!user.imapPassword && !user.googleRefreshToken) || !user.email) {
        console.warn(`[SYNC] User ${user?._id} has no IMAP configuration.`);
        return;
    }

    if (activeConnections.has(user._id.toString())) {
        console.log(`[SYNC] Connection already active for user ${user.email}`);
        return;
    }

    let accessToken = '';
    if (user.googleRefreshToken) {
        try {
            const oAuth2Client = new OAuth2Client(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET
            );
            oAuth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
            const res = await oAuth2Client.getAccessToken();
            accessToken = res.token;
        } catch (err) {
            console.error(`[SYNC] Failed to refresh access token for ${user.email}:`, err.message);
            return;
        }
    }

    const config = {
        imap: {
            user: user.email,
            password: user.imapPassword || undefined,
            xoauth2: accessToken ? buildXoauth2Token(user.email, accessToken) : undefined,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            authTimeout: 10000,
            tlsOptions: { rejectUnauthorized: false }
        }
    };

    try {
        const connection = await imaps.connect(config);
        activeConnections.set(user._id.toString(), connection);
        console.log(`[SYNC] Connected to IMAP for user: ${user.email}`);

        await connection.openBox('INBOX');

        connection.on('mail', async () => {
            console.log(`[SYNC] New mail for ${user.email}`);
            await checkUserUnreadEmails(user._id.toString(), user.email);
        });

        await checkUserUnreadEmails(user._id.toString(), user.email);
    } catch (e) {
        console.error(`[SYNC] IMAP Failed for ${user.email}:`, e.message);
    }
};

export const stopUserEmailListener = (userId) => {
    const conn = activeConnections.get(userId.toString());
    if (conn) {
        conn.end();
        activeConnections.delete(userId.toString());
        console.log(`[SYNC] Stopped IMAP for user ID: ${userId}`);
    }
};

const checkUserUnreadEmails = async (userId, userEmail) => {
    const connection = activeConnections.get(userId);
    if (!connection) return;

    try {
        const searchCriteria = ['UNSEEN'];
        const fetchOptions = {
            bodies: [''],
            markSeen: true
        };

        const messages = await connection.search(searchCriteria, fetchOptions);

        for (const item of messages) {
            const all = item.parts.find((part) => part.which === '');
            const id = item.attributes.uid;
            const idHeader = "Imap-Id: " + id + "\r\n";

            const parsedMeta = await simpleParser(idHeader + all.body);

            const subject = parsedMeta.subject || '';
            const text = parsedMeta.text || parsedMeta.textAsHtml || '';

            // Optional: Filter explicitly by email domains known for banking to save parsing
            // For now we run our local fast parser
            console.log(`Processing new email: ${subject}`);

            const result = await parseRawMessages(text);

            if (result.transactions && result.transactions.length > 0) {
                // If it successfully extracted transactions, save them to the database
                // Note: We need a User context. Since backend is generic right now, 
                // we'll append this to a 'Global' statement or the most recent statement ID for simplicity?
                // Best practice is having a User object to sync against.

                // Let's find the most recent statement for THIS user and append
                const mostRecentStatement = await Statement.findOne({ userId: userId }).sort({ uploadDate: -1 });
                if (mostRecentStatement) {
                    const newTrxs = result.transactions.map(t => ({
                        ...t,
                        description: `[Email Sync - ${userEmail}] ${t.description}`
                    }));

                    let incomeAdd = 0;
                    let expenseAdd = 0;

                    newTrxs.forEach(t => {
                        if (t.type === 'income') incomeAdd += t.amount;
                        else expenseAdd += t.amount;
                    });

                    await Statement.findByIdAndUpdate(mostRecentStatement._id, {
                        $push: { transactions: { $each: newTrxs } },
                        $inc: { totalIncome: incomeAdd, totalExpense: expenseAdd }
                    });

                    console.log(`[SYNC] Appended ${newTrxs.length} transactions to statement for user ${userEmail}.`);
                }
            }
        }
    } catch (e) {
        console.error(`[SYNC] Error for ${userEmail}:`, e.message);
    }
};
