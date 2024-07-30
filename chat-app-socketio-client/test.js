import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import Axios from "../../Utils/AxiosConfig";
import ApiNames from "../../Constants/ApiName";
import toastr from 'toastr';
import 'toastr/build/toastr.css';
import socket from "../../services/socket";
import MySkeleton from '../../services/MySkeleton';

const EnquireChat = () => {
  const { id } = useParams();
  const fileInputRef = useRef(null)
  const navigate = useNavigate();
  const [getEnquiries, setEnquiries] = useState([]);
  const [getCount, setCount] = useState(false);
  const [isRole, setIsRole] = useState();
  const [getAgentDetails, setAgentDetails] = useState([]);
  const [getChatMessages, setChatMessages] = useState([]);
  const [getUserDetails, setUserDetails] = useState([]);
  const [isCalled, setIsCalled] = useState('');
  const [isClosed, setIsClosed] = useState();
  const [productDetails, setProductDetails] = useState([]);
  const [message, setMessage] = useState("");
  const [getFile, setFile] = useState("");
  const [messages, setMessages] = useState([]);
  const chatIds = JSON.parse(id);
  const chatEndRef = useRef(null);
  useEffect(() => {
    let type = localStorage.getItem('type')
    setIsRole(type)
    if (getCount === false) {
      getEnquries();
      setCount(true)
    }

  }, [isCalled]);

  // This navigates back to the previous page
  const goBack = () => {
    navigate(-1);
  };


  const closeChat = async () => {
    try {
      debugger
      if (isRole === 'adm') {
        return
      }
      const { eId } = chatIds;
      let data = {
        eId: eId
      }

      if (window.confirm("Are you sure you want to delete this Chat?")) {
        const url = `${ApiNames.closeChat}`;

        const responce = await Axios.post(url, data);
        console.log(responce.data)
        if (responce.data?.success) {
          setIsClosed(responce.data?.success)
          toastr.success(responce.data?.status)
        }
      }


    } catch (err) {
      toastr.error(err?.responce.data?.error)
    }
  }

  // const scrollToBottom = () => {
  //   chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // };
  const getEnquries = async () => {
    const { type, aId, eId } = chatIds;
    let isAdmin = await localStorage.getItem('type')
    const url = `${ApiNames.getEnquiries}${type}&aId=${aId}`;

    try {
      const { data } = await Axios.get(url);
      if (data.success) {
        const updatedEnquiries = data.enquiries.map(enquiry => {
          const isActive = enquiry?._id === eId;

          if (isActive) {
            getChatDetails(enquiry);
          }
          return {
            ...enquiry,
            active: isActive,
          };
        });
        setIsCalled(null);
        const anyActive = updatedEnquiries.some(enquiry => enquiry.active);
        if (!anyActive && updatedEnquiries.length > 0) {
          updatedEnquiries[0].active = true
          getChatDetails(updatedEnquiries[0]);
        }
        console.log("Updated Enquiries:", updatedEnquiries);
        debugger
        setEnquiries(updatedEnquiries);
      }
    } catch (err) {
      console.error("Error fetching enquiries:", err);
    }
  };
  const selectedEnquiry = (data) => {
    console.log(data);
    setCount(false)
    let createIds = {
      eId: data?._id,
      aId: data?.agentId?._id,
      type: "all"
    };
    // Change the value to trigger the useEffect
    navigate(`/enquirechat/${JSON.stringify(createIds)}`);
    setIsCalled("1");
  };
  const getChatDetails = async (data) => {
    try {


      const url = ApiNames.getChat;
      const createParam = `${data?._id}&aId=${data?.agentId?._id}`;
      const response = await Axios.get(`${url}${createParam}`);
      setChatMessages(null)
      setChatMessages(response.data)
      setAgentDetails(response.data?.equiryDetails?.agentId)
      setIsClosed(response.data?.equiryDetails?.isClosed)
      setUserDetails(response.data?.equiryDetails?.userId)
      setProductDetails(response.data?.equiryDetails?.productId)
      let type = ""
      if (isRole === "adm") {
        type = "admin"

      } else {
        type = "agent"
      }

      joinRoom(response.data?.equiryDetails?._id, response.data?.equiryDetails?.agentId?.name, type)

    } catch (err) {
      console.log(err)
    }
  }

  // room joining function
  const joinRoom = (rId, name, type) => {
    socket.emit('joinRoom', { rId, name, type })
  }


  // sending message function
  const sendMessage = () => {
    var messageType
    var messages
    if (getFile.toLowerCase().endsWith(".jpg") || getFile.toLowerCase().endsWith(".jpeg") || getFile.toLowerCase().endsWith(".png")) {
      // If ends with one of these extensions, keytype should be "image"
      messageType = "image";
    } else {
      // Otherwise, keytype should be "text"
      messageType = "text";
    }

    if (message) {
      messages = message
    }
    if (getFile) {
      messages = getFile
    }
    let sendObj = {
      id: getAgentDetails?._id,
      pId: productDetails?._id,
      eId: getChatMessages?.equiryDetails?._id,
      message: messages,
      type: messageType,
      room: getChatMessages?.equiryDetails?._id,
      sender: getAgentDetails?.name
    };
    console.log(sendObj)
    socket.emit("message", sendObj);
    setMessage("");
  }

  // listening message from server like any one joined or messages etc
  useEffect(() => {
    socket.on("message", (data) => {
      console.log(data);

      scrollToBottom();
      const createdDate = new Date().toISOString();
      const formattedDate = createdDate.split('T')[0];
      const dateParts = formattedDate.split('-');
      const displayDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

      setMessages((prevMessages) => [...prevMessages, data]);
      console.log(data);
      if (data.type === "chat") {
        setChatMessages((prevValue) => {
          // Make a copy of the previous state
          let updatedValue = { ...prevValue };

          // Initialize the chats for the displayDate if it doesn't exist
          if (!updatedValue.chats[displayDate]) {
            updatedValue.chats[displayDate] = [];
          }

          // Validate the data before pushing to prevent unwanted entries
          if (isValidData(data.data)) {
            // Push the new data into the chats array for the displayDate
            updatedValue.chats[displayDate].push(data.data);
          }

          // Return the updated state
          return updatedValue;
        });
      }
    });

    return () => {
      socket.off("message");
    };
  }, []);

  // Add a validation function to check the data
  const isValidData = (data) => {
    // Add your validation logic here. For example:
    if (typeof data !== 'string' || data.trim() === '') {
      return false;
    }
    // Add more conditions as necessary
    return true;
  };


  // upload image to chat

  const handleFileChange = async (e) => {

    let file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    if (file) {
      const url = `${ApiNames.UPLOADIMAGE}chat`;
      try {
        const response = await Axios.post(url, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        if (response.data && response.data.locations.length > 0) {
          let imgUrl = response.data.locations[0].location
          let messageType
          if (imgUrl.toLowerCase().endsWith(".jpg") || imgUrl.toLowerCase().endsWith(".jpeg") || imgUrl.toLowerCase().endsWith(".png")) {
            // If ends with one of these extensions, keytype should be "image"
            messageType = "image";
          } else {
            // Otherwise, keytype should be "text"
            messageType = "pdf";
          }
          // setMessage(null)
          // setFile(response.data.locations[0].location)
          let sendObj = {
            id: getAgentDetails?._id,
            pId: productDetails?._id,
            eId: getChatMessages?.equiryDetails?._id,
            message: response.data.locations[0].location,
            type: messageType,
            room: getChatMessages?.equiryDetails?._id,
            sender: getAgentDetails?.name
          };
          console.log(sendObj)
          // Sending message from UI to Server
          socket.emit("message", sendObj);
        } else {
          console.error("Image upload failed: No image URL returned");
        }
      } catch (error) {
        console.error("Image upload failed:", error);
      }
    }
  };

  const openPDF = (url) => {
    window.open(url, '_blank'); // Open PDF in a new tab
  };

  const scrollToBottom = () => {
    var chatMessages = document.getElementById('chat-messages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  return (
    <>
      <div>
        <div className="messanger-top">
          <div className="row">
            <div className="col-3">
              <div className="message-head">
                <div onClick={goBack} className="message-name" >
                  <i className="fas fa-arrow-left" />
                  <div className="msg-user-name">{getEnquiries[0]?.agentId?.name || <MySkeleton className="msg-user-name" />}</div>
                </div>
                <div className="message-head-name">
                  <h1 className="msg-top-name">Message</h1>
                </div>
                <div className="msg-input-header">
                  <div className="msg-input-data">
                    <input
                      type="text"
                      placeholder="search"
                      className="msg-search-name"
                    />
                    <i className="fas fa-search msg-search" />
                  </div>
                  <div className="msg-date-select">
                    <i className="fas fa-calendar-alt date-calender" />
                    <select
                      className="form-select form-select-sm select-calender"
                      aria-label=".form-select-sm example"
                    >
                      <option selected>date range</option>
                      <option value={1}>One</option>
                      <option value={2}>Two</option>
                      <option value={3}>Three</option>
                    </select>
                  </div>
                </div>
                <div className="profile-msg-user">
                  {getEnquiries?.map((enquiry, index) => (

                    <div
                      key={index}
                      onClick={() => selectedEnquiry(enquiry)}
                      className="profile-user-name"
                      style={{ backgroundColor: enquiry?.active ? '#e8f4ff' : '#f5f7fa' }}
                    >

                      <div className="user-profile-headname">
                        <img
                          src="/images/landing/profile1.png"
                          className="profile-img"
                          alt="Profile"
                        />
                        <div className="user-profile">
                          {enquiry.isClosed ? (
                            <label >closed</label>

                          ) : (
                            null
                          )}

                          <h1 className="username-head">
                            {enquiry?.active} {enquiry?.userId?.mobile || <MySkeleton />}
                          </h1>
                          <p className="user-profile-para">
                            {enquiry?.productId?.title || <MySkeleton />}
                          </p>
                        </div>
                      </div>
                      <div className="profile-date">
                        <p className="user-update">
                          {new Date(enquiry?.sentOn).toLocaleDateString() || <MySkeleton />}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="user-chat-content">
                <div className="chat-msg-user">
                  <div className="chat-user-name">
                    <div className="user-chat-headname">
                      <img
                        src="/images/landing/profile1.png"
                        className="chat-img"
                      />
                      <div className="user-chat">
                        <h1 className="username-head">  {getUserDetails?.mobile || <MySkeleton />}</h1>
                        <p className="user-profile-para">{productDetails?.title || <MySkeleton />}</p>
                      </div>
                    </div>

                    {isRole === 'adm' ? (
                      <div className="chat-date">
                        <i className="fas fa-ellipsis-h chat-dots" />
                      </div>
                    ) : (
                      <div className="chat-date">

                        {isClosed ? (
                          <button type="button" className="chatclose-btn" >Closed</button>

                        ) : (
                          <button type="button" onClick={closeChat} className="chatclose-btn" >Chat Close</button>

                        )}
                      </div>
                    )}
                  </div>
                </div>


                <div>

                  <div className="chatcontent-middile" id="chat-messages">
                    {getChatMessages?.chats ? (
                      <div>
                        {getChatMessages?.chats && Object.keys(getChatMessages.chats).map(date => (
                          <div key={date}>
                            <p className="chat-paradate">{date}</p>
                            <div className="content-chats">
                              {getChatMessages.chats[date].map(chat => (
                                <div key={chat?._id}>
                                  {chat?.sentBy !== 'agent' ? (
                                    <div ref={chatEndRef} className={`left-chat-content ${chat?.type === 'image' ? 'image' : 'text'}`}>
                                      {chat?.type === 'image' ? (
                                        <img src={chat?.message} alt="chat image" className="left-chat-image" />
                                      ) : chat?.type === 'pdf' ? (
                                        <div className="pdf-container">
                                          <a href={chat.message} target="_blank" rel="noopener noreferrer" onClick={() => openPDF(chat.message)}>
                                            <img src="/images/landing/pdf.svg" className="pdf-icon" alt="pdf-icon" />
                                          </a>
                                        </div>
                                      ) : (
                                        <p className="left-para-content">{chat?.message || <MySkeleton />}</p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className={`right-chat-content ${chat?.type === 'image' ? 'image' : 'text'}`}>
                                      {chat?.type === 'image' ? (
                                        <img src={chat.message} alt="chat image" className="right-chat-image" />
                                      ) : chat?.type === 'pdf' ? (
                                        <div className="pdf-container">
                                          <a href={chat.message} target="_blank" rel="noopener noreferrer" onClick={() => openPDF(chat.message)}>
                                            <img src="/images/landing/pdf.svg" className="pdf-icon" alt="pdf-icon" />
                                          </a>
                                        </div>
                                      ) : (
                                        <p className="right-para-content">{chat?.message || <MySkeleton />}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (

                      <div><label>Loader</label></div>
                    )}

                  </div>
                </div>


                {isRole === 'adm' ? (
                  <div>
                    <p className="closed-chatdata">Closed Chat (admin)</p>

                  </div>
                ) : (
                  <div>
                    {isClosed ? (
                      // <p className="closed-chatdata">Chat Closed</p>
                      <div className="typesomething">
                        <p className="closed-chatdata">Closed Chat</p>
                      </div>
                    ) : (
                      <div className="typesomething">
                        <input
                          type="text"
                          placeholder="Type something"
                          className="somethingtypeing"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                        />
                        <input
                          type="file"
                          id="fileInput"
                          style={{ display: 'none' }}
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                        {/* <i className="fas fa-paperclip icon-attch" /> */}
                        <button className="send-imagebutton" onClick={() => fileInputRef.current.click()}>
                          <i className="fas fa-paperclip icon-attch" />
                        </button>
                        <button className="send-imagebutton" onClick={sendMessage}>
                          <img src="/images/landing/send-icon.svg" className="img-sending" alt="Send" />
                        </button>
                      </div>
                    )}


                  </div>
                )}
              </div>
            </div>
            <div className="col-3">
              <div className="information-user">
                <h2 className="user-profile-top">User Profile</h2>
                <div className="user-profile-info">
                  <img
                    src="/images/landing/profile1.png"
                    className="profie-info"
                  />
                </div>
                <div className="userinfo-head">
                  <h1 className="user-headernm">Information</h1>
                  <div className="username-head">
                    <i className="fas fa-phone-alt usercontact" />
                    <div className="usertopname">
                      <a className="name-user">
                        {getUserDetails?.mobile || <MySkeleton />}
                      </a>
                      <a>
                        <p className="para-username">contact</p>
                      </a>
                    </div>
                  </div>
                </div>
                <div className="userinfo-head">
                  {isRole === 'adm' ? (
                    <div>
                      <h2 className="agent-profile-top">Agent Profile</h2>
                      <h1 className="user-headernm">Information</h1>
                      <div className="username-head">
                        <i className="fas fa-user usercontact" />
                        <div className="usertopname">
                          <h1 className="name-user">{getAgentDetails?.name || <MySkeleton />}</h1>
                          <p className="para-username">username</p>
                        </div>
                      </div>
                      <div className="username-head">
                        <i className="fas fa-envelope usercontact" />
                        <div className="usertopname">
                          <a className="name-user">
                            {getAgentDetails?.email || <MySkeleton />}
                          </a>
                          <p className="para-username">gmail</p>
                        </div>
                      </div>
                      <div className="disable-blockBtn-top">
                        <button className="disable-Btn">Disable Account</button>
                        {/* <NavLink className="block-Btn" >
                          {isBlocked ? "Unblock Agent" : "Block Agent"}
                        </NavLink> */}
                      </div>
                    </div>
                  ) : (
                    <div className="chat-files">
                      <p>No Files data Available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div >
    </>
  );
};

export default EnquireChat;