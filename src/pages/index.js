import React, { useState, useEffect } from "react";
import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "@/styles/Main.module.css";
import { useRouter } from "next/router";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const router = useRouter();
  const domain = "today-menu-api.gguge.com";
  const [chatRooms, setChatRooms] = useState([]);

  useEffect(() => {
    fetchChatRooms();
  }, []);

  const fetchChatRooms = async () => {
    try {
      const response = await fetch(`https://${domain}/api/v1/rooms`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const { data } = await response.json();
      setChatRooms(data); // 받아온 데이터로 채팅방 목록 업데이트
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
    }
  };

  const handleRoomClick = (roomId) => {
    router.push(`/chat/${roomId}`);
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
          <div className={styles.topBar}>
            <img className={styles.profileImg} src="img/profileImg.png" />
          </div>
          <div className={styles.notice}>
            <p>현재 채팅방 {chatRooms.length}개</p>
          </div>
          {chatRooms.map((room, index) => (
            <div
              key={index}
              className={styles.chatRoomContainer}
              onClick={() => handleRoomClick(room.id)}
            >
              <img className={styles.profileImg} src="img/profileImg.png" />
              <div>
                <p className={styles.chatRoomName}>{room.title}</p>
                <p className={styles.chatRoomNumber}>채팅방 ID: {room.id}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
