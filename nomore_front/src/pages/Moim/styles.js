/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

export const container = css`
  padding: 24px;
`;

export const memberList = css`
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const memberItem = css`
  padding: 8px 12px;
  margin-bottom: 4px;
  cursor: pointer;
  border: 1px solid #ddd;
  border-radius: 4px;
  &:hover {
    background: #f5f5f5;
  }
`;
