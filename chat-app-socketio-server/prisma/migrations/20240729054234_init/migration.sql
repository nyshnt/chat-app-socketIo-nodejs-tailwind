-- CreateTable
CREATE TABLE "chatroom" (
    "id" TEXT NOT NULL,
    "firstUserId" TEXT NOT NULL,
    "secondUserId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstUserId" TEXT NOT NULL,
    "secondUserId" TEXT NOT NULL,
    "chatRoomId" TEXT NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chatroom_roomId_key" ON "chatroom"("roomId");
