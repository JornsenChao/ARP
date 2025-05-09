// src/components/ChatComponent.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Stack,
  Button,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { Bolt, Mic } from '@mui/icons-material';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';
import Speech from 'speak-tts';

const DOMAIN = 'http://localhost:8000';

const ChatComponent = ({ handleResp, isLoading, setIsLoading, activeFile }) => {
  const [searchValue, setSearchValue] = useState('');
  const [isChatModeOn, setIsChatModeOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speech, setSpeech] = useState(null);

  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  // snackbar (replaces antd message)
  const [snack, setSnack] = useState({ open: false, text: '' });
  const openSnack = (text) => setSnack({ open: true, text });
  const closeSnack = () => setSnack({ open: false, text: '' });

  // init speech-synthesis
  useEffect(() => {
    const sp = new Speech();
    sp.init({ volume: 1, lang: 'en-GB' })
      .then(() => setSpeech(sp))
      .catch((e) => console.error('Speech init error:', e));
  }, []);

  // auto-submit when voice input stops
  useEffect(() => {
    if (!listening && transcript) {
      onSearch(transcript);
      setIsRecording(false);
      resetTranscript();
    }
  }, [listening, transcript]);

  const onSearch = async (question) => {
    if (!activeFile) {
      return openSnack('No file selected');
    }
    if (!question.trim()) return;

    setSearchValue('');
    setIsLoading(true);

    try {
      const res = await axios.get(`${DOMAIN}/chat`, {
        params: { question, fileKey: activeFile },
      });

      handleResp(question, res.data);

      if (isChatModeOn && speech) {
        speech.speak({ text: res.data, queue: false });
      }
    } catch (err) {
      console.error(err);
      handleResp(question, { error: err.message });
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
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          placeholder="Type your question"
          fullWidth
          size="small"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch(searchValue)}
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
            {isRecording ? 'Recording…' : 'Rec'}
          </Button>
        )}
      </Stack>

      {/* snackbar for warnings */}
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
