import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
/** @jsxImportSource @emotion/react */
import * as s from './styles';
import useCategoryQuery from '../../queries/useCategoryQuery';
import useMoimQuery from '../../queries/useMoimQuery';

function SearchPage(props) {
    const navigate = useNavigate();
    const location = useLocation();
    const searchMoim = location.state;
    const { categoryId, districtId, searchText } = location.state || {};

    const moimQuery = useMoimQuery({ size: 8, categoryId, districtId, searchText });
    const allMoims = moimQuery?.data?.pages?.map(page => page.data.body.contents).flat() || [];
    const isLast = moimQuery?.data?.data?.body.isLast || false;

    const categoryQuery = useCategoryQuery();
    const categoryList = categoryQuery?.data?.data;

    const loaderRef = useRef(null);
    

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                if(moimQuery.hasNextPage) {
                    moimQuery.fetchNextPage();
                }
            }
        }, { 
            rootMargin: "500px",
        });

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => {
            if (loaderRef.current) {
                observer.unobserve(loaderRef.current);
            }
        };
    }, [loaderRef.current]);

    const handleMoimOnClick = (moimId) => {
        navigate(`/suggest/description?moimId=${moimId}`);
    };

    return (
        <div css={s.containerStyle}>
            <div css={s.headerStyle}>
                <h2>검색 결과</h2>
                {allMoims && allMoims.length > 0 && (
                    <p className="result-count">총 {allMoims.length}개의 모임을 찾았습니다</p>
                )}
            </div>

            {!allMoims || allMoims.length === 0 ? (
                <div css={s.noResultStyle}>
                    <div className="icon">🔍</div>
                    <h3>검색 결과가 없습니다</h3>
                    <p>다른 검색어나 필터를 사용해보세요.</p>
                </div>
            ) : (
                <ul css={s.gridContainerStyle}>
                    {allMoims?.map((moim) => {
                            const memberCount = moim.moimMemberCount || moim.memberCount || 0;
                            const maxMember = moim.moimMaxMember || moim.maxMember || 0;
                            const imagePath = moim.moimImagePath || moim.moimImgPath;
                            const title = moim.moimTitle || moim.title || "제목 없음";
                            const description = moim.moimDiscription || moim.discription;
                            const districtName = moim.districtName || "지역 정보 없음";
                            
                            let categoryName = moim.categoryName;
                            if (!categoryName && moim.categoryId) {
                                const category = categoryList.find(cat => cat.categoryId === moim.categoryId);
                                categoryName = category ? `${category.categoryEmoji} ${category.categoryName}` : "카테고리 정보 없음";
                            }
                            
                            const isAvailable = memberCount < maxMember;
                            const hasImage = imagePath && imagePath !== '' && imagePath !== 'null';
                            const imageUrl = `${imagePath}`;
                        
                        return (
                            <li key={moim.moimId} css={s.moimCardStyle}  onClick={() => handleMoimOnClick(moim.moimId)}>
                                {hasImage ? (
                                    <div css={s.imageStyle}>
                                        <img 
                                            src={imageUrl} 
                                            alt={moim.moimTitle}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML = `
                                                    <div style="
                                                        width: 100%;
                                                        height: 100%;
                                                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                                        display: flex;
                                                        align-items: center;
                                                        justify-content: center;
                                                        color: white;
                                                        font-size: 18px;
                                                        font-weight: bold;
                                                    ">
                                                        ${moim.moimTitle}
                                                    </div>
                                                `;
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div css={s.defaultImageStyle}>
                                        {moim.moimTitle}
                                    </div>
                                )}
                                
                                <div css={s.contentStyle}>
                                    <h3 css={s.titleStyle}>{moim.moimTitle}</h3>
                                    
                                    <p css={s.descriptionStyle}>
                                        {moim.moimDiscription || '모임에 대한 자세한 설명이 곧 업데이트됩니다.'}
                                    </p>
                                    
                                    <div css={s.tagsStyle}>
                                        <span css={s.locationTagStyle}>📍 {districtName}</span>
                                        <span css={s.categoryTagStyle}>
                                            {(() => { 
                                                const found = categoryList.find(c => c.categoryId === (moim.categoryId ?? moim.moimCategoryId));
                                                return found ? `${found.categoryEmoji} ${found.categoryName}` : '카테고리 정보 없음';
                                            })()}
                                        </span>
                                    </div>
                                    
                                    <div css={s.memberInfoStyle}>
                                        <div css={s.memberCountStyle}>
                                            👥 <span className="current">{moim.memberCount}</span>
                                            <span> / </span>
                                            <span className="total">{moim.maxMember}명</span>
                                        </div>
                                        
                                        <div css={s.statusBadgeStyle} className={isAvailable ? 'available' : 'full'}>
                                            {isAvailable ? '모집중' : '모집완료'}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {!isLast && <div ref={loaderRef} style={{ height: "50px" }} />}
        </div>
    );
}

export default SearchPage;