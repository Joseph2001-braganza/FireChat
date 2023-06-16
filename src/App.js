import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import './App.css';

// Initialize Firebase
const firebaseConfig = {
  // Your Firebase configuration
  apiKey: "AIzaSyC1o8w_42AI-QXI4mGI6dxFMVcgamZeIGo",
  authDomain: "chatzzapp-a24dd.firebaseapp.com",
  databaseURL: "https://chatzzapp-a24dd-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chatzzapp-a24dd",
  storageBucket: "chatzzapp-a24dd.appspot.com",
  messagingSenderId: "668671561630",
  appId: "1:668671561630:web:78e761720d83e3e9fdd08f",
  measurementId: "G-WGP0P94J2V"
};

firebase.initializeApp(firebaseConfig);

const App = () => {
  const [user, setUser] = useState(null);
  const [chatRooms, setChatRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchMode, setSearchMode] = useState('group');
  const [currentPrivateChat, setCurrentPrivateChat] = useState(null);
  const [privateChatMessages, setPrivateChatMessages] = useState([]);
  const [newPrivateMessage, setNewPrivateMessage] = useState('');

  const groupSearchResults = searchMode === 'group' ? chatRooms : [];
  const userSearchResults = searchMode === 'user' ? Object.values(users) : [];

  // Authenticate user with Google
  const signInWithGoogle = async () => {
    setSelectedUser(null)
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      const result = await firebase.auth().signInWithPopup(provider);
      const { uid, displayName } = result.user;

      // Check if the user already exists in the database
      const userRef = firebase.database().ref(`users/${uid}`);
      userRef.once('value', (snapshot) => {
        if (!snapshot.exists()) {
          // Create a new user in the database
          userRef.set({
            displayName: displayName,
            uid:uid
          });
        }
      });

      setUser(result.user);
    } catch (error) {
      console.error(error);
    }
  };

  // Search groups and people
  const searchGroupsAndPeople = () => {
    const filteredRooms = chatRooms.filter(([id, room]) =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredUsers = Object.values(users).filter((user) =>
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults([...filteredRooms, ...filteredUsers]);
  };

  // Functions to handle which search mode to use
  const switchToGroupSearch = () => {
    setSearchMode('group');
    setSelectedUser(null)
    setSearchQuery('');
  };

  const switchToUserSearch = () => {
    setSearchMode('user');
    setSearchQuery('');
  };

// Start a private chat with another user
// Start a private chat with another user
// ...

// Start a private chat with another user
// ...

// Start a private chat with another user
const startPrivateChat = (user) => {
  setSelectedUser(user);

  // Check if the private chat entry already exists
  const privateChatQuery = firebase
    .database()
    .ref('privateChats')
    .orderByChild('sender_receiver')
    .equalTo(`${user.displayName}_${user.uid}`)
    .limitToFirst(1);

  privateChatQuery.once('value', (snapshot) => {
    if (snapshot.exists()) {
      // Private chat entry already exists, retrieve the chat data
      const privateChatData = snapshot.val();
      const privateChatKey = Object.keys(privateChatData)[0];
      console.log(privateChatKey)
      // Set the current private chat using the private chat key
      setCurrentPrivateChat(privateChatKey);
      // Retrieve the messages for the existing private chat
      firebase
        .database()
        .ref(`privateChats/${privateChatKey}/messages`)
        .on('value', (snapshot) => {
          const messages = snapshot.val();
          if (messages) {
            const messageList = Object.entries(messages).map(([id, message]) => ({
              id,
              ...message,
            }));
            setPrivateChatMessages(messageList);
          } else {
            setPrivateChatMessages([]);
          }
        });
    } else {
      // Private chat entry does not exist, create a new private chat
      const privateChatData = {
        sender_receiver: `${user.displayName}_${user.uid}`,
      };
      const key=firebase.database().ref('privateChats');
      const newPrivateChatRef = firebase.database().ref('privateChats').push();
      //const newPrivateChatKey = newPrivateChatRef.key.replace(/\.|\$|#|\[|\]/g, '-');
      const newPrivateChatKey=key['$key']
      newPrivateChatRef.set(privateChatData);
      // Set the current private chat using the new private chat key
      setCurrentPrivateChat(newPrivateChatKey);
      // Set an empty array for messages since it's a new private chat
      setPrivateChatMessages([]);
    }
  });
};

// ...


  //Group Search.
  const GroupSearch=(RoomName)=>{

    //main logic
    console.log(RoomName);
    const chatData=firebase
    .database()
    .ref("chatRooms")
    .orderByChild("name")
    .equalTo(RoomName)
    .limitToFirst(1)

    console.log(chatData)

    chatData.on("value", (snapshot) => {
      if (snapshot.exists()) {
        // Room exists in the database
        console.log("Room exists");
        // Access the room data using snapshot.val()
        console.log("Room data:", snapshot.val());
      } else {
        // Room does not exist in the database
        console.log("Room does not exist");
      }
    }, (error) => {
      console.error("Error searching for room:", error);
    });
  }

  //User Search
  const UserSearch=(PersonName)=>{
    console.log(PersonName)
  }

  // Log out user
  const signOut = async () => {
    try {
      await firebase.auth().signOut();
      setUser(null);
      setCurrentRoom(null);
      setMessages([]);
    } catch (error) {
      console.error(error);
    }
  };

  // Create a new chat room
  const createChatRoom = () => {
    const roomName = prompt('Enter the name of the new chat room:');
    if (roomName) {
      const newRoom = firebase.database().ref('chatRooms').push();
      newRoom.set({
        name: roomName,
        createdBy: user.uid,
        participants: {
          [user.uid]: true,
        },
      });

      // Update the chatRooms state with the new room
      setChatRooms([...chatRooms, [newRoom.key, { name: roomName, createdBy: user.uid }]]);
    }
  };

  // Join a chat room
  const joinChatRoom = (roomId) => {
    setCurrentRoom(roomId);
    setMessages([]);

    // Retrieve message history for the chat room
    firebase
      .database()
      .ref(`chatRooms/${roomId}/messages`)
      .on('value', (snapshot) => {
        const snapshotValue = snapshot.val();
        const messageList = snapshotValue ? Object.values(snapshotValue) : [];
        setMessages(messageList);
      });
  };

  // Leave the current chat room
  const leaveChatRoom = () => {
    // Remove the user from the chat room participants
    firebase.database().ref(`chatRooms/${currentRoom}/participants/${user.uid}`).remove();
    setCurrentRoom(null);
    setMessages([]);
  };

  // Delete a chat room
  const deleteChatRoom = (roomId) => {
    // Check if the user is the owner of the chat room
    const room = chatRooms.find(([id]) => id === roomId);
    if (room[1].createdBy === user.uid) {
      // Remove the chat room from the database
      firebase.database().ref(`chatRooms/${roomId}`).remove();
    }
    console.log('removing')
  };

  // Send a new message
  const sendMessage = () => {
    if (newMessage && currentRoom) {
      const newMessageRef = firebase.database().ref(`chatRooms/${currentRoom}/messages`).push();
      newMessageRef.set({
        content: newMessage,
        sender: user.displayName,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
      });
      setNewMessage('');
    }
  };

// Send a private chat message

const sendPrivateMessage = (messageContent) => {
  const timestamp = firebase.database.ServerValue.TIMESTAMP;
  console.log(newPrivateMessage)
  // Construct the private chat message object
  const privateChatMessage = {
    sender: user.uid,
    receiver: selectedUser.uid,
    content: newPrivateMessage,
    timestamp: timestamp,
  };

  // Get the reference to the current private chat
  const privateChatRef = firebase.database().ref(`privateChats/${currentPrivateChat}`);

  // Push the private chat message to the messages list
  privateChatRef.child('messages').push(privateChatMessage);

};

//removing the private Chat Rooms let's go ...
const leavePrivateChatRoom=()=>{
  setCurrentPrivateChat(null)
  setPrivateChatMessages([])
  setSelectedUser(null)
}



// Get the private chat key for a given user ID
const getPrivateChatKey = (userId) => {
  return user.uid < userId ? `${user.uid}_${userId}` : `${userId}_${user.uid}`;
};

  useEffect(() => {
    // Retrieve chat rooms
    firebase.database().ref('chatRooms').on('value', (snapshot) => {
      const snapshotValue = snapshot.val();
      const roomList = snapshotValue ? Object.entries(snapshotValue) : [];
      setChatRooms(roomList);
      setSearchResults([...roomList, ...Object.values(users)]);
    });

    // Retrieve users
    firebase.database().ref('users').on('value', (snapshot) => {
      const snapshotValue = snapshot.val();
      const userList = snapshotValue ? Object.values(snapshotValue) : [];
      setUsers(snapshotValue);
      setSearchResults([...chatRooms, ...userList]);
    });

    // Clean up listeners
    return () => {
      firebase.database().ref().off();
      firebase.auth().signOut();
    };
  }, []);

  useEffect(() => {
    if (currentPrivateChat) {
      // Retrieve private chat messages
      firebase
        .database()
        .ref(`privateChats/${currentPrivateChat}/messages`)
        .on('value', (snapshot) => {
          const snapshotValue = snapshot.val();
          const privateChatMessageList = snapshotValue ? Object.values(snapshotValue) : [];
          setPrivateChatMessages(privateChatMessageList);
        });
    } else {
      setPrivateChatMessages([]);
    }
  }, [currentPrivateChat]);

  //setCurrentPrivateChat(null)
  //setPrivateChatMessages([])
              
  return (
    <div className="app">
      {user ? (
        <div className="chat-app">
          <h1>Welcome, {user.displayName}</h1>
          <button className="sign-out-btn" onClick={signOut}>
            Sign Out
          </button>
          {currentRoom || selectedUser? (selectedUser !== null ? (
             <div className="private-chat">
             <div className='private-chat-header'>
             <h2>Private Chat: {selectedUser.displayName}</h2>
             <button className="leave-private-chat-btn" onClick={leavePrivateChatRoom}>
               Leave Private Chat
             </button>
             </div>
             <ul className="private-chat-messages">
               {privateChatMessages.map(({ content, sender }) => (
             <li
             className={`private-chat-message ${
             sender === user.uid ? 'sent' : 'received'
             }`}
            >
           <span className="message-content">{content}</span>
           </li>
           ))}
         </ul>
             <div className="private-chat-input">
               <input
                 type="text"
                 placeholder="Type your message..."
                 value={newPrivateMessage}
                 onChange={(e) => setNewPrivateMessage(e.target.value)}
               />
               <button className="send-private-message-btn" onClick={sendPrivateMessage}>
                 Send
               </button>
             </div>
           </div>
          ):(
            ( 
              <div className="chat-room">
              <div className='chat-room-header'>
              <h2>Chat Room: {chatRooms.find(([id]) => id === currentRoom)[1].name}</h2>
              <button className="leave-room-btn" onClick={leaveChatRoom}>
                Leave Room
              </button>
              </div>
              <ul className="message-list">
                {messages.map(({ content, sender }, index) => (
                  <li
                    key={index}
                    className={`message ${sender === user.displayName ? 'sent' : 'received'}`}
                  >
                    <strong>{sender === user.displayName ? 'You' : sender}</strong>: {content}
                  </li>
                ))}
              </ul>
              <div className="message-input">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button className="send-message-btn" onClick={sendMessage}>
                  Send
                </button>
              </div>
            </div>
            ) 
          )): (
            <div className="chat-rooms">
              <h2>Chat Rooms</h2>
              <button className="create-room-btn" onClick={createChatRoom}>
                Create New Room
              </button>
              <div className="search-bar">
                <button
                  className={`search-btn ${searchMode === 'group' ? 'active' : ''}`}
                  onClick={switchToGroupSearch}
                >
                  Group Search
                </button>
                <button
                  className={`search-btn ${searchMode === 'user' ? 'active' : ''}`}
                  onClick={switchToUserSearch}
                >
                  User Search
                </button>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${searchMode === 'group' ? 'group' : 'user'}`}
                  className="search-input"
                />
                <button className={`search-btn ${searchMode === 'group' ? 'active' : ''}`} onClick={searchMode?()=>GroupSearch(searchQuery) :()=>UserSearch(searchQuery)}>{`Search for ${searchMode}`}</button>
              </div>

              <ul className="search-results">
                {searchMode === 'group' &&
                  groupSearchResults.map(([id, room]) => (
                    <li key={id} className='listSearch'>
                    {room.name}
                    {/* {`Created By ${}`} */}
                    <button onClick={() => joinChatRoom(id)}>Join</button>
                    {user.uid === room.createdBy && (
                  <button
                    onClick={() => deleteChatRoom(id)}
                    style={{ backgroundColor: 'red', alignSelf: 'flex-end' }}
                    >
                    Delete
                  </button>
                  )}
                  </li>
                  ))}
                {searchMode === 'user' &&
                  userSearchResults.map((user1) => (
                    (user.displayName!==user1.displayName)&&<li className='listSearch' key={user1.uid}>
                      {user1.displayName}
                      <button onClick={() => startPrivateChat(user1)}>Message</button>
                    </li>
                ))}
              </ul>
            </div>
          )}
          {/* {searchMode === 'user'&& selectedUser&&(
            <div className="private-chat">
              <div className='private-chat-header'>
              <h2>Private Chat: {selectedUser.displayName}</h2>
              <button className="leave-private-chat-btn" onClick={() => setCurrentPrivateChat(null)}>
                Leave Private Chat
              </button>
              </div>
              <ul className="private-chat-messages">
                {privateChatMessages.map(({ content, sender }) => (
              <li
              className={`private-chat-message ${
              sender === user.uid ? 'sent' : 'received'
              }`}
             >
            <span className="message-content">{content}</span>
            </li>
            ))}
          </ul>
              <div className="private-chat-input">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newPrivateMessage}
                  onChange={(e) => setNewPrivateMessage(e.target.value)}
                />
                <button className="send-private-message-btn" onClick={sendPrivateMessage}>
                  Send
                </button>
              </div>
            </div>
          )} */}
        </div>
      ) : (
        <div className="sign-in">
          <h1>Chat App</h1>
          <button className="sign-in-btn" onClick={signInWithGoogle}>
            Sign in with Google
          </button>
        </div>
      )}
    </div>
  );
};

export default App;