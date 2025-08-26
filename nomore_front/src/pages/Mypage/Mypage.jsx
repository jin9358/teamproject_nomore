/** @jsxImportSource @emotion/react */
import * as s from './styles';
import React, { useState, useEffect } from 'react';
import useCategoryQuery from '../../queries/useCategoryQuery';
import api, { baseURL } from "../../api/axios";
import usePrincipalQuery from '../../queries/usePrincipalQuery';
import { reqMyMoimList } from '../../api/moimApi';
import { useNavigate } from 'react-router-dom';
import { deleteUser } from '../../api/userApi';
import { reqGetForumsWithParams } from '../../api/forumApi';

function Mypage(props) {

    const navigate = useNavigate();
    const categoryQuery = useCategoryQuery();
    const categories = categoryQuery?.data?.data || []
    const principalQuery = usePrincipalQuery();
    const user = principalQuery?.data?.data?.user;
    const [ categoryList, setCategoryList ] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const oldCategory = categories.find(prev => prev.categoryId === user.categoryId)

    const [myMoims, setMyMoims] = useState([]);
    const [myPosts, setMyPosts] = useState([]); // [추가]

    // 내가 참여한 모임 가져오기
    useEffect(() => {
        if (user?.userId) {
            reqMyMoimList(user.userId)
                .then(res => {
                    setMyMoims(res.data);
                })
                .catch(err => {
                    console.error(err);
                    setMyMoims([]);
                });
        }
    }, [user]);

    // 내가 참여한 모임별 게시판을 불러와 "내가 쓴 글"만 모으기 
    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                if (!user?.userId || myMoims.length === 0) {
                    if (alive) setMyPosts([]);
                    return;
                }

                const params = { page: 1, size: 10, writerId: user.userId, userId: user.userId };

                const results = await Promise.all(
                    myMoims.map(m =>
                        reqGetForumsWithParams(m.moimId, params)
                        .then(resp => {
                            // 이 부분을 추가해서 실제 구조 확인
                            console.log(`모임 ${m.moimId}의 실제 응답:`, resp);
                            console.log(`응답 데이터 구조:`, Object.keys(resp));
                            if(resp.data) console.log(`data 구조:`, Object.keys(resp.data));
                            
                            // 실제 데이터가 어디 있는지 찾기
                            let list = [];
                            if (resp?.data?.body?.contents) {
                                list = resp.data.body.contents;
                            } else if (resp?.data?.data?.body?.contents) {
                                list = resp.data.data.body.contents;
                            } else if (resp?.data) {
                                list = Array.isArray(resp.data) ? resp.data : [];
                            }
                            
                            console.log(`모임 ${m.moimId} 리스트:`, list);
                            return { moimId: m.moimId, list };
                        })
                        .catch(err => {
                            console.error(`모임 ${m.moimId} 에러:`, err);
                            return { moimId: m.moimId, list: [] };
                        })
                    )
                );

                // 병합도 간단하게
                const allPosts = results.flatMap(({ moimId, list }) => 
                    list.map(post => ({ ...post, moimId }))
                );

                // 필터링도 간단하게
                const myPosts = allPosts.filter(post => 
                    post.userId === user.userId
                );

                console.log('전체 글:', allPosts);
                console.log('내가 쓴 글:', myPosts);
                console.log('user.userId:', user.userId);

                if (alive) setMyPosts(myPosts);
            } catch (e) {
                console.error(e);
                if (alive) setMyPosts([]);
            }
            const results = await Promise.all(
                myMoims.map(m =>
                    reqGetForumsWithParams(m.moimId, params)
                    .then(resp => {
                        console.log(`✅ 모임 ${m.moimId} 성공:`, resp);
                        return { moimId: m.moimId, list: resp.data };
                    })
                    .catch(err => {
                        console.error(`❌ 모임 ${m.moimId} 실패:`, err);
                        console.error('에러 상세:', err.response);
                        return { moimId: m.moimId, list: [] };
                    })
                )
            );
        })();

        return () => { alive = false; };
    }, [user?.userId, myMoims]);
    
    const handleToggleCategoryOnClick = () => {
        setIsCategoryOpen((prev) => !prev);
        setCategoryList(categories);
    }

    const handleCategoryOnChange = (e) => {
        setSelectedCategory(e.target.value);
        setIsCategoryOpen(false);
    }
 
    const mypageInputEmpty = {
        nickName: user?.nickName || '',
        introduction: user?.introduction || '',
    }

    const [ mypageModify, setMypageModify ] = useState(mypageInputEmpty);

    const handleMypageModifyOnChange = (e) => {
        setMypageModify(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }))
    }

    const [profileImageFile, setProfileImageFile] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState(null);

    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (profileImagePreview) URL.revokeObjectURL(profileImagePreview);
            setProfileImageFile(file);
            setProfileImagePreview(URL.createObjectURL(file));
        } else {
            setProfileImageFile(null);
            setProfileImagePreview(null);
        }
    };

    useEffect(() => {
        return () => {
            if (profileImagePreview) URL.revokeObjectURL(profileImagePreview);
        };
    }, [profileImagePreview]);

    const handleSaveOnclick = async () => {
        const formData = new FormData();
        const choice = categoryList.find(prev => prev.categoryName === selectedCategory)
        formData.append("nickName", mypageModify.nickName);
        formData.append("introduction", mypageModify.introduction);
        formData.append("categoryId", choice?.categoryId || user.categoryId);
        if (profileImageFile) formData.append("profileImg", profileImageFile);

        try {
            await api.put("/api/user/profile", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            await principalQuery.refetch();
            alert("수정 완료!");
        } catch (e) {
            alert("수정 실패!");
        }
    };

    const handleDeleteUserOnClick = async () => {

        const confirmDelete = window.confirm("정말 회원 탈퇴를 진행하시겠습니까?");
        if (!confirmDelete) return;

        try {
            await deleteUser(user.userId);
            localStorage.removeItem("AccessToken");

            await principalQuery.refetch();
            alert("회원 탈퇴가 완료되었습니다.");
            navigate("/");
        } catch (error) {
            console.error(error);
            alert("회원 탈퇴 중 오류가 발생했습니다.");
        }
    };

    const handleMoimOnClick = (moimId) => {
        navigate(`/suggest/description?moimId=${moimId}`);
    };

    const handleMyForumOnClick = (mf) => { 
        const forumId = mf.forumId ?? mf.id ?? mf.postId;         
        const moimId  = mf.moimId ??  mf.moim?.moimId; 
        if (!forumId || !moimId) return;
        navigate(`/forum/detail?moimId=${moimId}&forumId=${forumId}`);
    };
    
    return (
        <div css={s.mypageLayout}>
            {/* 왼쪽 섹션 - 개인정보 수정 */}
            <div css={s.leftSection}>
                <h1 css={s.pageTitle}>마이페이지</h1>
                
                {/* 프로필 이미지 섹션 */}
                <div css={s.profileSection}>
                    <div css={s.profileImage}>
                        <img 
                            src={profileImagePreview || `${user?.profileImgPath}`}
                            alt="프로필"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <div className="placeholder" style={{ display: 'none' }}>👤</div>
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        id="profileImageInput"
                        style={{ display: 'none' }}
                        onChange={handleProfileImageChange}
                    />
                    <button 
                        css={s.profileImageUpload}
                        type="button"
                        onClick={() => document.getElementById('profileImageInput').click()}
                    >
                        이미지 업로드
                    </button>
                </div>

                {/* 입력 필드 */}
                <div css={s.infoContainer}>
                    <div css={s.infoItem}>
                        <label css={s.infoLabel}>닉네임</label>
                        <input 
                            css={s.inputStyle}
                            type="text" 
                            name='nickName' 
                            value={mypageModify.nickName}
                            onChange={handleMypageModifyOnChange}
                        />
                    </div>

                    <div css={s.infoItem}>
                        <label css={s.infoLabel}>한줄 소개</label>
                        <input 
                            css={s.inputStyle}
                            type="text" 
                            name='introduction' 
                            value={mypageModify.introduction}
                            onChange={handleMypageModifyOnChange}
                        />
                    </div>

                    <div css={s.infoItem}>
                        <label css={s.infoLabel}>관심 카테고리</label>
                        <div css={s.dropdownContainer}>
                            <button css={s.dropdownButton} onClick={handleToggleCategoryOnClick}>
                                {selectedCategory || oldCategory?.categoryName}
                            </button>
                            {isCategoryOpen && (
                                <div css={s.dropdownMenu}>
                                    {categoryList.map((category, index) => (
                                        <div key={index} css={s.dropdownItem}>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name='category'
                                                    value={category.categoryName}
                                                    checked={selectedCategory === category.categoryName}
                                                    onChange={handleCategoryOnChange}
                                                />
                                                {category.categoryName}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div css={s.buttonContainer}>
                    <button css={s.saveButton} onClick={handleSaveOnclick}>
                        개인정보수정
                    </button>
                </div>
                <div>
                    <button css={s.dangerButton} onClick={handleDeleteUserOnClick}>
                        회원 탈퇴
                    </button>
                </div>
            </div>

            <div css={s.rightTwoCol}>
            {/* [추가] 패널 1: 내가 참여한 모임 */}
            <section css={s.panel}>
                <h2 css={s.moimHeader}>내가 참여한 모임</h2>
                {myMoims.length === 0 ? (
                <p>참여한 모임이 없습니다.</p>
                ) : (
                myMoims.map(moim => (
                    <div key={moim.moimId} css={s.moimCard} onClick={() => handleMoimOnClick(moim.moimId)}>
                    <div css={s.moimImageContainer}>
                        {moim.moimImgPath ? (
                        <img
                            src={`${baseURL}/image${moim.moimImgPath}`.replace('//','/')}
                            alt={moim.title}
                            css={s.moimImage}
                        />
                        ) : (
                        <div css={s.moimDefaultImage}>📭</div>
                        )}
                    </div>
                    <div css={s.moimContent}>
                        <h3>{moim.title}</h3>
                        <p>{moim.discription}</p>
                        <span>👥 {moim.memberCount}/{moim.maxMember}명</span>
                    </div>
                    </div>
                ))
                )}
            </section>

            {/* [추가] 패널 2: 내가 쓴 글 */}
            <section css={s.panel}>
                <h2 css={s.moimHeader}>내가 쓴 글</h2>
                {myPosts.length === 0 ? (
                <p>작성한 글이 없습니다.</p>
                ) : (
                <div css={s.postList}>
                    {myPosts.map((p) => (
                    <div
                        key={p.forumId ?? p.id ?? p.postId}
                        className="item"
                        onClick={() => handleMyForumOnClick(p)}
                    >
                        <div className="title">{p.title ?? p.postTitle ?? '(제목 없음)'}</div>
                        <div className="meta">
                        <span>
                            📅 {new Date(p.createdAt ?? p.regDate ?? p.created_at ?? Date.now())
                            .toLocaleDateString()}
                        </span>
                        {p.moimTitle && <span>🏷 {p.moimTitle}</span>}
                        </div>
                    </div>
                    ))}
                </div>
                )}
            </section>
            </div>
        </div>
    );
}

export default Mypage;
