// src/components/ChatComponent.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Button,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Mic, Bolt } from '@mui/icons-material';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';
import Speech from 'speak-tts';

import { API_BASE as DOMAIN } from '../utils/apiBase';
import { getSessionId } from '../utils/sessionId';
// docId 用于区分不同文档的对话
// 由父组件针对每个文件动态生成

const ChatComponent = (props) => {
  const {
    handleResp,
    isLoading,
    setIsLoading,
    activeFile,
    docId, // 文档级别的会话ID
  } = props;

  const [searchValue, setSearchValue] = useState('');
  const [isChatModeOn, setIsChatModeOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Snackbar (replaces antd message)
  const [snack, setSnack] = useState({ open: false, text: '' });
  const openSnack = (text) => setSnack({ open: true, text });
  const closeSnack = () => setSnack({ open: false, text: '' });

  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  // 语音播放对象
  const [speech, setSpeech] = useState(null);
  useEffect(() => {
    const sp = new Speech();
    sp.init({ volume: 1, lang: 'en-GB' })
      .then(() => setSpeech(sp))
      .catch((e) => console.error('Speech init error:', e));
  }, []);

  useEffect(() => {
    if (!listening && transcript) {
      onSearch(transcript);
      setIsRecording(false);
      resetTranscript();
    }
  }, [listening, transcript]);

  const onSearch = async (question) => {
    if (!activeFile) {
      console.log('[ChatComponent] Attempted question with no file selected');
      return openSnack('No file selected');
    }
    if (!question.trim()) return;

    setSearchValue('');
    setIsLoading(true);

    // 1) 把用户问题保存到对话Memory
    try {
      const sessionId = getSessionId();
      await axios.post(`${DOMAIN}/conversation/memory?sessionId=${sessionId}`, {
        docId,
        role: 'user',
        text: question,
      });
    } catch (err) {
      console.error('Failed to save user question:', err);
    } // 2) 请求后端 QuickTalk Q&A
    try {
      const sessionId = getSessionId();
      const res = await axios.get(
        `${DOMAIN}/conversation/quicktalk?sessionId=${sessionId}`,
        {
          params: {
            question,
            fileKey: activeFile,
            docId,
          },
        }
      );
      // 3) 把回答也保存到Memory
      const answerText =
        typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
      try {
        await axios.post(
          `${DOMAIN}/conversation/memory?sessionId=${sessionId}`,
          {
            docId,
            role: 'assistant',
            text: answerText,
          }
        );
      } catch (err) {
        console.error('Failed to save AI answer:', err);
      }

      // 4) 更新前端对话状态
      handleResp(question, answerText);

      // 5) 如果ChatMode开，朗读回答
      if (isChatModeOn && speech) {
        speech.speak({ text: answerText, queue: false });
      }
    } catch (err) {
      console.error(err);
      // Improve error handling with specific messages
      if (
        err.response?.status === 404 &&
        err.response?.data?.error?.includes('not found or not built')
      ) {
        handleResp(
          question,
          "Sorry, this file hasn't been processed yet. Please wait a moment and try again."
        );
        openSnack('File is still being processed. Please wait a moment.');
      } else {
        handleResp(question, `Error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChatMode = () => {
    setIsChatModeOn((v) => !v);
    if (isRecording) {
      setIsRecording(false);
      SpeechRecognition.stopListening();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      SpeechRecognition.stopListening();
    } else {
      setIsRecording(true);
      SpeechRecognition.startListening();
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1}>
        <TextField
          placeholder="Type your question"
          fullWidth
          size="small"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearch(searchValue);
          }}
        />

        <Button
          variant="contained"
          disableElevation
          onClick={() => onSearch(searchValue)}
          disabled={isLoading}
          startIcon={
            isLoading ? (
              <CircularProgress size={18} sx={{ mr: 0.5 }} />
            ) : (
              <Bolt />
            )
          }
        >
          Ask
        </Button>

        <Button
          variant="contained"
          color={isChatModeOn ? 'error' : 'primary'}
          onClick={toggleChatMode}
        >
          Chat&nbsp;Mode:&nbsp;{isChatModeOn ? 'On' : 'Off'}
        </Button>

        {isChatModeOn && (
          <Button
            variant="contained"
            color={isRecording ? 'error' : 'primary'}
            startIcon={<Mic />}
            onClick={toggleRecording}
          >
            {isRecording ? 'Recording...' : 'Rec'}
          </Button>
        )}
      </Stack>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="warning" onClose={closeSnack} sx={{ width: '100%' }}>
          {snack.text}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ChatComponent;
