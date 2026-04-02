import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { linkGoogleAccount } from '../api';

const GoogleCallback = ({ currentUser, setCurrentUser }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const code = searchParams.get('code');
    const [status, setStatus] = useState('Linking your Gmail account...');

    useEffect(() => {
        if (!code || !currentUser) {
            navigate('/settings/security');
            return;
        }
        
        linkGoogleAccount(code, currentUser._id)
            .then(res => {
                setCurrentUser(res.user);
                navigate('/settings/security', { state: { flash: 'Gmail linked successfully via OAuth!' } });
            })
            .catch(err => {
                setStatus('Failed: ' + err.message);
                setTimeout(() => navigate('/settings/security'), 3000);
            });
    }, [code, currentUser, navigate]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', color: 'var(--text-primary)' }}>
            <div className="spinner"></div>
            <h3>{status}</h3>
        </div>
    );
};

export default GoogleCallback;
