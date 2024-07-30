import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

import User2 from '../User2/User2';

function Home() {
    const [email, setEmail] = useState('')
    const [userToken, setUserToken] = useState('')
    const [userId, setUserId] = useState('')
    const [password, setPassword] = useState('')
    const [socket, setSocket] = useState(null);

    const handleSignin = async (e) => {
        e.preventDefault();
        const formData = {
            email: email,
            password: password
        }
        const response = await fetch(`http://127.0.0.1:3003/v1/user/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });
        if (response.ok) {
            const data = await response.json()
            const token = data.access_token
            setUserToken(token)

            setUserId(data.userId)

            const socketConnection = io.connect('http://localhost:3000', {
                auth: { token: token },
            });
            setSocket(socketConnection)
            // console.log("Response :", data)
        } else {
            alert(response.statusText)
            console.log("error :", response.statusText)
        }
    }

    return (
        <div className='flex flex-row h-screen bg-slate-200 items-center justify-center font-mono'>
            {!userToken && <div className="bg-blue-300 h-1/2 w-1/2 flex rounded-lg">
                <form className="w-64 mx-auto mb-12 mt-20">
                    <input value={email}
                        onChange={ev => setEmail(ev.target.value)}
                        type="text" placeholder="Email"
                        className="block w-full rounded-sm p-2 mb-2" />
                    <input value={password}
                        onChange={ev => setPassword(ev.target.value)}
                        type="password"
                        placeholder="password"
                        className="block w-full rounded-sm p-2 mb-2" />
                    <button className="bg-blue-500 text-white block w-full rounded-sm p-2"
                        onClick={handleSignin}
                    >Login</button>
                </form>
            </div>
            }
            {/* <User1 onSendMessage={handleSendMessage} messages={messages} /> */}
            {userToken && <User2 userToken={userToken} userId={userId} email={email} socket={socket} />}
        </div>
    );
}

export default Home;
