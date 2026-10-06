import { createSlice } from "@reduxjs/toolkit";
import {
  asyncGetPosts,
  asyncGetDetailPost,
  asyncAddPost,
  asyncChangePost,
  asyncChangeCoverPost,
  asyncDeletePost,
  asyncLikePost,
  asyncAddComment,
  asyncDeleteComment,
  asyncDeleteAllPosts,
} from "./action";
import type { Post } from "@/types";

interface PostsState {
  posts: Post[];
  post: Post | null;
  isPost: boolean;
  isPostAdd: boolean;
  isPostAdded: boolean;
  isPostChange: boolean;
  isPostChanged: boolean;
  isPostChangeCover: boolean;
  isPostChangedCover: boolean;
  isPostDelete: boolean;
  isPostDeleted: boolean;
  isPostLike: boolean;
  isPostLiked: boolean;
  isPostAddComment: boolean;
  isPostAddedComment: boolean;
  isPostDeleteComment: boolean;
  isPostDeletedComment: boolean;
  isPostDeleteAll: boolean;
  isPostDeletedAll: boolean;
}

const initialState: PostsState = {
  posts: [],
  post: null,
  isPost: false,
  isPostAdd: false,
  isPostAdded: false,
  isPostChange: false,
  isPostChanged: false,
  isPostChangeCover: false,
  isPostChangedCover: false,
  isPostDelete: false,
  isPostDeleted: false,
  isPostLike: false,
  isPostLiked: false,
  isPostAddComment: false,
  isPostAddedComment: false,
  isPostDeleteComment: false,
  isPostDeletedComment: false,
  isPostDeleteAll: false,
  isPostDeletedAll: false,
};

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    resetPostFlags(state) {
      state.isPostAdded = false;
      state.isPostChanged = false;
      state.isPostChangedCover = false;
      state.isPostDeleted = false;
      state.isPostLiked = false;
      state.isPostAddedComment = false;
      state.isPostDeletedComment = false;
      state.isPostDeletedAll = false;
    },
    clearPost(state) {
      state.post = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(asyncGetPosts.pending, (state) => {
        state.isPost = true;
      })
      .addCase(asyncGetPosts.fulfilled, (state, action) => {
        state.isPost = false;
        state.posts = action.payload;
      })
      .addCase(asyncGetPosts.rejected, (state) => {
        state.isPost = false;
      })
      .addCase(asyncGetDetailPost.pending, (state) => {
        state.isPost = true;
      })
      .addCase(asyncGetDetailPost.fulfilled, (state, action) => {
        state.isPost = false;
        state.post = action.payload;
      })
      .addCase(asyncGetDetailPost.rejected, (state) => {
        state.isPost = false;
      })
      .addCase(asyncAddPost.pending, (state) => {
        state.isPostAdd = true;
        state.isPostAdded = false;
      })
      .addCase(asyncAddPost.fulfilled, (state) => {
        state.isPostAdd = false;
        state.isPostAdded = true;
      })
      .addCase(asyncAddPost.rejected, (state) => {
        state.isPostAdd = false;
      })
      .addCase(asyncChangePost.pending, (state) => {
        state.isPostChange = true;
        state.isPostChanged = false;
      })
      .addCase(asyncChangePost.fulfilled, (state) => {
        state.isPostChange = false;
        state.isPostChanged = true;
      })
      .addCase(asyncChangePost.rejected, (state) => {
        state.isPostChange = false;
      })
      .addCase(asyncChangeCoverPost.pending, (state) => {
        state.isPostChangeCover = true;
        state.isPostChangedCover = false;
      })
      .addCase(asyncChangeCoverPost.fulfilled, (state) => {
        state.isPostChangeCover = false;
        state.isPostChangedCover = true;
      })
      .addCase(asyncChangeCoverPost.rejected, (state) => {
        state.isPostChangeCover = false;
      })
      .addCase(asyncDeletePost.pending, (state) => {
        state.isPostDelete = true;
        state.isPostDeleted = false;
      })
      .addCase(asyncDeletePost.fulfilled, (state) => {
        state.isPostDelete = false;
        state.isPostDeleted = true;
      })
      .addCase(asyncDeletePost.rejected, (state) => {
        state.isPostDelete = false;
      })
      .addCase(asyncLikePost.pending, (state) => {
        state.isPostLike = true;
        state.isPostLiked = false;
      })
      .addCase(asyncLikePost.fulfilled, (state) => {
        state.isPostLike = false;
        state.isPostLiked = true;
      })
      .addCase(asyncLikePost.rejected, (state) => {
        state.isPostLike = false;
      })
      .addCase(asyncAddComment.pending, (state) => {
        state.isPostAddComment = true;
        state.isPostAddedComment = false;
      })
      .addCase(asyncAddComment.fulfilled, (state) => {
        state.isPostAddComment = false;
        state.isPostAddedComment = true;
      })
      .addCase(asyncAddComment.rejected, (state) => {
        state.isPostAddComment = false;
      })
      .addCase(asyncDeleteComment.pending, (state) => {
        state.isPostDeleteComment = true;
        state.isPostDeletedComment = false;
      })
      .addCase(asyncDeleteComment.fulfilled, (state) => {
        state.isPostDeleteComment = false;
        state.isPostDeletedComment = true;
      })
      .addCase(asyncDeleteComment.rejected, (state) => {
        state.isPostDeleteComment = false;
      })
      .addCase(asyncDeleteAllPosts.pending, (state) => {
        state.isPostDeleteAll = true;
        state.isPostDeletedAll = false;
      })
      .addCase(asyncDeleteAllPosts.fulfilled, (state) => {
        state.isPostDeleteAll = false;
        state.isPostDeletedAll = true;
        state.posts = [];
      })
      .addCase(asyncDeleteAllPosts.rejected, (state) => {
        state.isPostDeleteAll = false;
      });
  },
});

export const { resetPostFlags, clearPost } = postsSlice.actions;
export default postsSlice.reducer;
