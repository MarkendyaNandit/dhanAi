
import { sendEmailOTP } from './backend/services/mailService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

async function testMail() {
    console.log('Testing mail service...');
    try {
        const result = await sendEmailOTP('markandeyanandit@gmail.com', '123456');
        console.log('Result:', result);
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testMail();
