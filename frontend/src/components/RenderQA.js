// src/components/RenderQA.js
import React from 'react';
import { CircularProgress, Box } from '@mui/material';

const RenderQA = ({ conversation, isLoading }) => (
  <>
    {conversation?.map((each, idx) => (
      <Box key={idx} mb={1.5}>
        {/* user question */}
        <Box textAlign="right">
          <Box
            sx={{
              display: 'inline-block',
              maxWidth: '50%',
              bgcolor: '#1677FF',
              color: 'common.white',
              p: 1.25,
              borderRadius: 2,
              mb: 0.5,
              wordBreak: 'break-word',
            }}
          >
            {each.question}
          </Box>
        </Box>

        {/* assistant answer */}
        <Box textAlign="left">
          <Box
            sx={{
              display: 'inline-block',
              maxWidth: '50%',
              bgcolor: '#F9F9FE',
              color: 'text.primary',
              p: 1.25,
              borderRadius: 2,
              mb: 0.5,
              wordBreak: 'break-word',
            }}
          >
            {typeof each.answer === 'string'
              ? each.answer
              : JSON.stringify(each.answer)}
          </Box>
        </Box>
      </Box>
    ))}

    {isLoading && <CircularProgress sx={{ mt: 1 }} />}
  </>
);

export default RenderQA;
