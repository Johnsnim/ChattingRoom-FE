import React, { useCallback, useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import * as StompJs from "@stomp/stompjs";

const inter = Inter({ subsets: ["latin"] });

export default function Chat() {
  const router = useRouter();
  const { roomId } = router.query;
  const domain = "today-menu-api.gguge.com";

  let [stompClient, setStompClient] = useState(null);
  const [chat, setChat] = useState("");
  const [chatList, setChatList] = useState([]);

  const [userId, setUserId] = useState("");

  const divRef = useRef(null);
  const chatbodyRef = useRef(null);

  const handleClick = () => {
    console.log(chat, "clicked");
    sendName();
    setChat("");
    divRef.current.innerText = "";
  };

  const handleChange = (event) => {
    event.preventDefault();
    setChat(event.target.textContent);
  };

  const handleKeyDown = (event) => {
    if (event.keyCode === 13) {
      handleClick();
    }
  };
  function formatTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      const hour = date.getHours();
      const minute = date.getMinutes();
      const period = hour < 12 ? "오전" : "오후";
      const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
      const formattedMinute = minute < 10 ? "0" + minute : minute;
      return `${period} ${formattedHour}시 ${formattedMinute}분`;
    } else {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}월 ${day}일`;
    }
  }

  const connect = useCallback(() => {
    try {
      const { roomId } = router.query;
      //const roomId = 1;
      const newuUserId =
        Math.floor(Math.random() * 1000000) + "-" + +new Date();
      setUserId(newuUserId);

      const stompClientInstance = new StompJs.Client({
        brokerURL: `wss://${domain}/sample-chatting`,
      });

      stompClientInstance.onConnect = async (frame) => {
        console.log("Connected: " + frame);

        await stompClientInstance.subscribe(
          "/topic/receive-message",
          (greeting) => {
            console.log("greeting: ", greeting);
            const message = JSON.parse(greeting.body);
            console.log("메>>", message);
            addMessage(message);
          }
        );

        const messages = await fetchMessages();

        messages.forEach((message) => {
          addMessage(message);
        });

        const payload = {
          roomId,
          userId,
        };

        await stompClientInstance.publish({
          destination: "/app/enter",
          body: JSON.stringify(payload),
        });
      };

      stompClientInstance.onWebSocketError = (error) => {
        console.error("Error with websocket", error);
      };

      stompClientInstance.onStompError = (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
      };

      setStompClient(stompClientInstance);
      stompClientInstance.activate();
      console.log("연결성공");
    } catch (err) {
      console.log("오류발생>>", err);
    }
  }, [router.query]);

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    if (userId) {
      createUser();
    }
  }, [userId]);

  useEffect(() => {
    chatbodyRef.current.scrollTop = chatbodyRef.current.scrollHeight;
  }, [chatList]);

  const disconnect = () => {
    if (stompClient) {
      stompClient.deactivate();
      console.log("Disconnected");
    }
  };

  const sendName = () => {
    if (stompClient) {
      const payload = {
        roomId,
        userId,
        content: chat,
      };

      stompClient.publish({
        destination: "/app/send-message",
        headers: {},
        body: JSON.stringify(payload),
      });
    }
  };

  const addMessage = (message) => {
    const { userId, content, id, createdAt } = message;
    const str = { sender: userId, content, id, createdAt };
    setChatList((prevChatList) => [...prevChatList, str]);
  };

  const fetchMessages = async () => {
    try {
      //const endpoint = `https://${domain}/api/v1/rooms/1/messages`;
      const endpoint = `https://${domain}/api/v1/rooms/${roomId}/messages`;

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      console.log("데이터>>", data);
      return data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  };

  const createUser = async () => {
    try {
      const endpoint = `https://${domain}/api/v1/users`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: userId, name: userId }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  return (
    <>
      <Head>
        <title>카카오톡 조무사</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.test}>
          <div className={styles.topContainer}>
            <div className={styles.topMenuBar}>
              <img className={styles.profileImg} src="/img/profileImg.png" />
              <div>
                <div className={styles.opponentName}>{roomId}번 채팅방</div>
                <div className={styles.memberNumber}>🧑 2</div>
              </div>
            </div>
          </div>
          <div className={styles.chatbody} ref={chatbodyRef}>
            {chatList.map((message, index) => (
              <div
                key={index}
                className={
                  message.sender === userId
                    ? styles.rightChatContainer
                    : styles.leftChatContainer
                }
              >
                {message.sender === userId ? (
                  ""
                ) : (
                  <img
                    className={styles.profileImg}
                    src="/img/profileImg.png"
                  />
                )}

                <div
                  className={
                    message.sender === userId
                      ? styles.rightChatInnerContainer
                      : styles.leftChatInnerContainer
                  }
                >
                  <span
                    className={
                      message.sender === userId
                        ? styles.rightNameBox
                        : styles.leftNameBox
                    }
                  >
                    {message.sender === userId ? "" : message.sender}
                  </span>

                  <div className={styles.chatBoxWithTime}>
                    <span
                      className={
                        message.sender === userId
                          ? styles.rightChatBox
                          : styles.leftChatBox
                      }
                    >
                      {message.content}
                    </span>
                    <span className={styles.createAtBox}>
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.bottombar}>
            <div
              ref={divRef}
              contentEditable="true"
              className={styles.inputContainer}
              onInput={handleChange}
              onKeyDown={handleKeyDown}
            />
            <div className={styles.bottomMenu}>
              <button className={styles.sendButton} onClick={handleClick}>
                전송
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
