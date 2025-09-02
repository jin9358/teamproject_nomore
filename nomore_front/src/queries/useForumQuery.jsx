import { useInfiniteQuery} from '@tanstack/react-query';
import React from 'react';
import { reqGetForums } from '../api/forumApi';

function useForumQuery({size, moimId}) {
    return useInfiniteQuery({
        queryKey: ["forums", size, moimId],
        queryFn: async ({pageParam = 1}) => await reqGetForums({page: pageParam, size, moimId}),
        getNextPageParam: (lastPage, allPages) => {
            console.log(lastPage)
            const currentPage = lastPage.data.body.page;
            const totalPages = lastPage.data.body.totalPages + 1;
            return currentPage + 1 < totalPages ? currentPage + 1 : undefined;
        },
    })
}

export default useForumQuery;