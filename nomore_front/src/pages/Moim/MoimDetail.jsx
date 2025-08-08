/** @jsxImportSource @emotion/react */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import * as s from './styles';

function MoimDetail() {
  const { moimId } = useParams();
  const [moim, setMoim] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    api.get(`/api/moim/${moimId}`)
      .then(res => setMoim(res.data))
      .catch(err => console.error(err));

    api.get(`/api/moim/${moimId}/members`)
      .then(res => setMembers(res.data))
      .catch(err => console.error(err));
  }, [moimId]);

  const handleMemberClick = (member) => {
    console.log("클릭된 멤버:", member);
  };

  if (!moim) {
    return <div css={s.container}>로딩 중...</div>;
  }

  return (
    <div css={s.container}>
      <h2>{moim.title}</h2>
      <p>{moim.discription}</p>
      <p>인원: {moim.memberCount} / {moim.maxMember}</p>

      <h3>멤버 목록</h3>
      <ul css={s.memberList}>
        {members.map(member => (
          <li
            key={member.userId}
            css={s.memberItem}
            onClick={() => handleMemberClick(member)}
          >
            {member.userName}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MoimDetail;
