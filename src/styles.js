export function createStyles(config) {
    return {
        chatButton: {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: '1000',
            padding: '15px',
            border: 'none',
            borderRadius: '30px',
            background: 'radial-gradient(462.56% 102.45% at 109.47% 102.45%,#a75bff 0,#635bff 57%,#635bff 100%)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '24px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            minWidth: '60px',
            minHeight: '60px',
            transition: 'transform 0.3s ease',
            '&:hover': {
                transform: 'scale(1.1)',
            },
        },
        chatContainer: {
            position: 'fixed',
            bottom: '95px',
            right: '20px',
            width: '40vw',
            height: '50vh',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            border: `1px solid ${config.chatBorderColor}`,
            borderRadius: '20px',
            display: 'none',
            flexDirection: 'column',
            zIndex: '1001',
            overflow: 'hidden',
            fontFamily: config.fontFamily,
            fontSize: config.fontSize,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(10px)',
        },
        chatHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px',
            //background: 'linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 10%)',
            //backdropFilter: 'blur(5px)',
            borderBottom: '1px solid rgba(204, 204, 204, 0.5)',
            position: 'sticky',
            top: 0,
            zIndex: 2,
        },
        chatTitle: {
            fontWeight: 'bold',
            fontSize: '18px',
            color: '#333',
            flex: 1,
            textAlign: 'left',
            marginRight: '15px',
        },
        clearButton: {
            padding: '10px 15px',
            border: 'none',
            borderRadius: '15px',
            backgroundColor: 'rgba(99, 91, 255, 0.1)',
            color: config.buttonColor,
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'background-color 0.3s',
            whiteSpace: 'nowrap',
        },
        chatMessages: {
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
        },
        messageAgent: {
            alignSelf: 'flex-start',
            backgroundColor: '#f0f0f0',
            borderRadius: '15px 15px 15px 0',
            padding: '10px 15px',
            maxWidth: '70%',
            marginBottom: '10px',
            wordBreak: 'break-word',
            '& p': { margin: '0 0 10px 0' },
            '& p:last-child': { marginBottom: 0 },
            '& pre': {
                backgroundColor: '#e0e0e0',
                padding: '10px',
                borderRadius: '5px',
                overflowX: 'auto',
            },
            '& code': {
                fontFamily: 'monospace',
                backgroundColor: '#e0e0e0',
                padding: '2px 4px',
                borderRadius: '3px',
            },
            '& ul, & ol': { paddingLeft: '20px' },
        },
        messageUser: {
            alignSelf: 'flex-end',
            backgroundColor: '#635bff',
            color: 'white',
            borderRadius: '15px 15px 0 15px',
            padding: '10px 15px',
            maxWidth: '70%',
            marginBottom: '10px',
            wordBreak: 'break-word',
        },
        inputContainer: {
            display: 'flex',
            borderTop: '1px solid #ccc',
            padding: '15px',
        },
        chatInput: {
            flex: '1',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '20px',
            backgroundColor: config.inputBackgroundColor,
            fontSize: '14px',
        },
        sendButton: {
            marginLeft: '10px',
            padding: '10px 15px',
            border: 'none',
            borderRadius: '20px',
            background: 'radial-gradient(462.56% 102.45% at 109.47% 102.45%,#a75bff 0,#635bff 57%,#635bff 100%)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '18px',
            transition: 'background-color 0.3s',
        },
        preloaderContainer: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 3,
        },
        preloader: {
            width: '60px',
            height: '60px',
        },
    };
}
