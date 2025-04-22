/*
// * - Low-level Socket.IO connection management
// * - Defines only basic Socket.IO events
// * - Used in registerCoreHandlers
*/
export const webSocketCoreEvents = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  ERROR: "error",
  JOIN_ROOM: "joinRoom",
  LEAVE_ROOM: "leaveRoom",
  ROOM_COUNT: "roomParticipantCount",
};

/**
 * webSocketAppEvents
 * - Defines events for application-specific concepts that include business logic
 * - Used in registerNotificationHandlers
 */
export const webSocketAppEvents = {
  // 接続関連
  CONNECT: "connect",
  DISCONNECT: "disconnect",

  HOST_JOINED: "host:joined",

  // セッション関連
  SESSION_JOIN_REQUEST: "session:join:request",
  SESSION_JOIN_SUCCESS: "session:join:success",

  SESSION_LEAVE_REQUEST: "session:leave:request",
  SESSION_LEAVE_SUCCESS: "session:leave:success",

  SESSION_DATA: "session:data",
  SESSION_DATA_RESPONSE: "session:data:response",

  SESSION_CLOSE_REQUEST: "session:close:request",
  SESSION_CLOSE_SUCCESS: "session:close:success",

  SESSION_CLEANUP_REQUEST: "session:cleanup:request",
  SESSION_CLEANUP_DONE: "session:cleanup:done",

  // 参加者関連
  PARTICIPANT_JOINED: "participant:joined",
  PARTICIPANT_LEFT: "participant:left",
  PARTICIPANT_UPDATE: "participant:update",
  PARTICIPANT_KICKED: "participant:kicked",

  // クイズ進行関連
  QUIZ_START_REQUEST: "quiz:start:request",
  QUIZ_START_SUCCESS: "quiz:start:success",
  QUIZ_STARTED: "quiz:started",
  QUIZ_NEXT_QUESTION: "quiz:next",
  QUIZ_SUBMIT_ANSWER: "quiz:submit",
  QUIZ_ANSWER_SUBMITTED: "quiz:answer:submitted",
  QUIZ_QUESTION_UPDATE: "quiz:question:update",
  ANSWER_RESULT_TO_PARTICIPANTS: "quiz:answer:result:participants",
  ANSWER_RESULT_TO_HOST: "quiz:answer:result:host",
  QUIZ_PAUSE_REQUEST: "quiz:pause:request",
  QUIZ_PAUSED: "quiz:paused",
  QUIZ_RESUME_REQUEST: "quiz:resume:request",
  QUIZ_RESUMED: "quiz:resumed",

  QUIZ_SHOW_RESULTS: "quiz:show:results",

  QUIZ_QUESTION_RESULT: "quiz:result",
  QUIZ_END: "quiz:end",

  // プレゼンス関連
  PRESENCE_UPDATE: "presence:update",
  PRESENCE_STATUS: "presence:status",

  // ルーム関連
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",

  // エラー
  ERROR: "error",
};
