import React from 'react';

function Message({ message, isSent }) {
    return (
        <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} my-2`}>
            <div
                className={`p-3 rounded-lg max-w-xs ${isSent ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'
                    }`}
            >
                {message}
            </div>
        </div>
    );
}

export default Message;


