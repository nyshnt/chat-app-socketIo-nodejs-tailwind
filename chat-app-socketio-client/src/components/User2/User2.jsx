import React, { useEffect, useRef, useState } from 'react';

function User2({ userToken, userId, email, socket }) {
    const [newMessages, setNewMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [startChat, setStartChat] = useState(true);
    const [secondUserId, setSecondUserId] = useState("");
    const [chatRoomId, setChatRoomId] = useState("");
    const [userList, setUserList] = useState([]);
    const chatEndRef = useRef(null);


    useEffect(() => {
        const messageListener = (data) => {
            console.log('Received data:', data);
            if (data.room === chatRoomId) {
                setNewMessages((prevMessages) => [
                    ...prevMessages,
                    { text: data.message, sent: data.sender === userId }
                ]);
            }
        };

        socket.on('received', messageListener);


        // Cleanup function to remove the listener when the component unmounts
        return () => {
            socket.off('received', messageListener);
        };
    }, [newMessages, socket])

    useEffect(() => {
        // Scroll to the bottom when new messages are added
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [newMessages]);


    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
            let sendObj = {
                message: message,
                room: chatRoomId,
                sender: userId,
                receiver: secondUserId,
            };
            console.log("msg Obj :", sendObj);
            socket.emit('message', sendObj);
            setNewMessages((prevMessages) => [...prevMessages, { text: message, sent: true }]);
            setMessage('');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`http://localhost:3003/v1/user/all_users`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + userToken
                    },
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                const users = data.users;
                const filteredUsers = users.filter(user => user.uuid !== userId);
                setUserList(filteredUsers);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [userToken, userId]);

    const startChatNow = async (user) => {
        setStartChat(!startChat);
        try {
            console.log("User :", user);
            const body = { secondUserId: user.uuid };
            const response = await fetch(`http://localhost:3000/start-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'token': userToken
                },
                body: JSON.stringify(body),
            });
            if (response.ok) {
                const data = await response.json();
                const roomId = data.roomId;
                console.log('Success:', data);

                socket.emit('joinRoom', { rId: roomId, name: email });
                setChatRoomId(data.roomId);
                setSecondUserId(user.uuid);

                const result = await fetch(`http://localhost:3000/previous-chats`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'token': userToken
                    },
                    body: JSON.stringify({ roomId: data.roomId }),
                });
                if (result.ok) {
                    const chats = await result.json();
                    console.log("Previous chats:", chats);
                    setNewMessages(chats.map(chat => ({ text: chat.message, sent: chat.firstUserId === userId })));
                } else {
                    console.error('Error:', result.statusText);
                }
            } else {
                console.error('Error:', response.statusText);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className='bg-red-300 p-5 m-2 w-1/2 rounded-lg flex flex-col overflow-y-auto h-screen relative mt-4 mb-4'>
            <div className='flex bg-orange-600 font-bold rounded-lg h-10 p-2 mb-2'>
                {email}
            </div>
            {startChat ? (
                <div className='flex flex-col items-center'>
                    {userList.map((user) => (
                        <div key={user.uuid} className='flex items-center justify-between w-full p-2 border-b'>
                            <div className='flex-1'>
                                {user.firstname + " " + user.lastname}
                            </div>
                            <button
                                className='bg-blue-500 text-white font-bold py-2 px-4 rounded ml-4'
                                onClick={() => startChatNow(user)}
                            >
                                Start chat
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className='flex flex-col flex-1 h-11 overflow-y-auto bg-customOrange rounded-2xl'>
                    <div className='flex flex-col flex-1 space-y-2 overflow-y-auto mb-4'>
                        {newMessages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`p-2 m-3 max-w-xs ${msg.sent ? 'bg-blue-500 rounded-tl-xl rounded-tr-xl rounded-bl-xl rounded-br-none' : 'bg-customGreen rounded-tl-xl rounded-tr-xl rounded-bl-none rounded-br-xl'}`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <form className='flex p-4 items-center space-x-2' onSubmit={sendMessage}>
                        <input
                            className='rounded-lg h-10 p-2 flex-1'
                            placeholder='message'
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <button
                            className='rounded-lg bg-blue-600 p-2 w-20'
                            disabled={!message.trim()}
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default User2;
