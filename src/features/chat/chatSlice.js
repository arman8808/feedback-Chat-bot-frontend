import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  connectionStatus: 'disconnected', // 'connecting', 'connected', 'disconnected', 'reconnecting'
  currentQuestion: null,
  questionIndex: 0,
  questions: [],
  answers: [],
  chatEnded: false,
  issue: null,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConnectionStatus: (state, action) => {
      state.connectionStatus = action.payload;
    },

    setQuestions: (state, action) => {
      state.questions = action.payload;
      state.currentQuestion = action.payload[0] || null;
      state.questionIndex = 0;
      state.chatEnded = false;
      state.answers = [];
    },

    addAnswer: (state, action) => {
      state.answers.push(action.payload);
    },

    nextQuestion: (state) => {
      if (state.questionIndex + 1 < state.questions.length) {
        state.questionIndex += 1;
        state.currentQuestion = state.questions[state.questionIndex];
      } else {
        state.currentQuestion = null;
        state.chatEnded = true;
      }
    },

    resetChat: (state) => {
      state.connectionStatus = 'disconnected';
      state.currentQuestion = null;
      state.questionIndex = 0;
      state.questions = [];
      state.answers = [];
      state.chatEnded = false;
      state.issue = null;
      state.error = null;
    },

    setIssue: (state, action) => {
      state.issue = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setConnectionStatus,
  setQuestions,
  addAnswer,
  nextQuestion,
  resetChat,
  setIssue,
  setError,
} = chatSlice.actions;

export default chatSlice.reducer;
