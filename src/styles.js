export function createStyles(config) {
    return {
        chatButton: {
            position: 'fixed',
            zIndex: '1000',
            padding: '15px',
            border: 'none',
            borderRadius: '50%',
            backgroundColor: config.buttonColor,
            color: 'white',
            cursor: 'pointer',
            fontSize: '24px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            ...(config.buttonPosition === 'bottom-right' ? { bottom: '20px', right: '20px' } : { bottom: '20px', left: '20px' })
        },
        chatContainer: {
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            width: '300px',
            height: '400px',
            backgroundColor: config.chatBackgroundColor,
            border: `1px solid ${config.chatBorderColor}`,
            borderRadius: '10px',
            display: 'none',
            flexDirection: 'column',
            zIndex: '1001',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            fontFamily: config.fontFamily,
            fontSize: config.fontSize,
            backdropFilter: 'blur(10px)'
        },
        chatMessages: {
            flex: '1',
            overflowY: 'auto',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column'
        },
        inputContainer: {
            display: 'flex',
            borderTop: '1px solid #ccc',
            padding: '10px'
        },
        chatInput: {
            flex: '1',
            padding: '10px',
            border: 'none',
            borderRadius: '20px',
            backgroundColor: config.inputBackgroundColor,
            marginRight: '10px'
        },
        sendButton: {
            padding: '10px',
            border: 'none',
            borderRadius: '50%',
            backgroundColor: config.sendButtonColor,
            color: 'white',
            cursor: 'pointer'
        }
    };
}

