// src/components/ChatComponent.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Input, message } from 'antd';
import { AudioOutlined, ThunderboltOutlined } from '@ant-design/icons';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';
import Speech from 'speak-tts';

const DOMAIN = 'http://localhost:8000';

// 注意，这里不再固定 sessionId，而是从 props 里接收
// 以便在父组件中针对每个 fileKey 动态生成 sessionId
// const SESSION_ID = 'quicktalk-session';

const ChatComponent = (props) => {
  const {
    handleResp,
    isLoading,
    setIsLoading,
    activeFile,
    sessionId, // 新增: 父组件传进来
  } = props;

  const [searchValue, setSearchValue] = useState('');
  const [isChatModeOn, setIsChatModeOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

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
      return message.warning('No file selected');
    }
    if (!question.trim()) return;

    setSearchValue('');
    setIsLoading(true);

    // 1) 把用户问题保存到对话Memory
    try {
      await axios.post(`${DOMAIN}/conversation/memory`, {
        sessionId, // 新增: 父组件传的 sessionId
        role: 'user',
        text: question,
      });
    } catch (err) {
      console.error('保存用户问题到memory失败:', err);
    }

    // 2) 请求后端 QuickTalk Q&A
    try {
      const res = await axios.get(`${DOMAIN}/conversation/quicktalk`, {
        params: {
          question,
          fileKey: activeFile,
          sessionId, // 同样带上
        },
      });
      // 3) 把回答也保存到Memory
      const answerText =
        typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
      try {
        await axios.post(`${DOMAIN}/conversation/memory`, {
          sessionId,
          role: 'assistant',
          text: answerText,
        });
      } catch (err) {
        console.error('保存AI回答到memory失败:', err);
      }

      // 4) 更新前端对话状态
      handleResp(question, answerText);

      // 5) 如果ChatMode开，朗读回答
      if (isChatModeOn && speech) {
        speech.speak({ text: answerText, queue: false });
      }
    } catch (err) {
      console.error(err);
      handleResp(question, { error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChatMode = () => {
    setIsChatModeOn(!isChatModeOn);
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
    <div style={{ display: 'flex', gap: '8px' }}>
      <Input
        placeholder="Type your question"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onPressEnter={() => onSearch(searchValue)}
        style={{ flex: 1 }}
      />
      <Button
        type="primary"
        icon={<ThunderboltOutlined />}
        onClick={() => onSearch(searchValue)}
        loading={isLoading}
      >
        Ask
      </Button>
      <Button type="primary" danger={isChatModeOn} onClick={toggleChatMode}>
        Chat Mode: {isChatModeOn ? 'On' : 'Off'}
      </Button>
      {isChatModeOn && (
        <Button
          icon={<AudioOutlined />}
          danger={isRecording}
          onClick={toggleRecording}
        >
          {isRecording ? 'Recording...' : 'Rec'}
        </Button>
      )}
    </div>
  );
};

export default ChatComponent;
