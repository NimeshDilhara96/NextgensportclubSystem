const router = require('express').Router();
const Post = require('../models/Post');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for media upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');  // Make sure this directory exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Only images and videos are allowed!');
        }
    }
});

// Create new post
router.post('/create', upload.array('media', 10), async (req, res) => {
    try {
        const { content } = req.body;
        
        // Process uploaded files and create proper URLs
        const mediaUrls = req.files ? req.files.map(file => {
            return file.path.replace(/^uploads[\/\\]/, '').replace(/\\/g, '/');
        }) : [];

        const newPost = new Post({
            content,
            media: mediaUrls.map(url => `uploads/${url}`)
        });

        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Get all posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Add a like to a post
router.post('/:postId/like', async (req, res) => {
    try {
        const { userId, userName, userEmail } = req.body;
        const postId = req.params.postId;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Check if user already liked
        const existingLike = post.likes.find(like => like.userEmail === userEmail);
        
        let updatedPost;
        if (existingLike) {
            // Remove like if it exists
            updatedPost = await Post.findByIdAndUpdate(
                postId,
                { $pull: { likes: { userEmail: userEmail } } },
                { new: true }
            );
        } else {
            // Add like if it doesn't exist
            updatedPost = await Post.findByIdAndUpdate(
                postId,
                { $push: { likes: { userEmail } } },
                { new: true }
            );
        }

        res.status(200).json(updatedPost);
    } catch (error) {
        console.error('Error updating like:', error);
        res.status(500).json({ error: 'Failed to update like' });
    }
});

// Add a comment to a post
router.post('/:postId/comment', async (req, res) => {
    try {
        const { userId, userName, content } = req.body;
        const postId = req.params.postId;

        if (!content || !userId || !userName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        post.comments.push({
            userId,
            userName,
            content,
            createdAt: new Date()
        });

        const updatedPost = await post.save();
        res.status(200).json(updatedPost);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Get comments for a post
router.get('/:postId/comments', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.status(200).json(post.comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// Delete post
router.delete('/:postId', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Delete associated media files
        if (post.media && post.media.length > 0) {
            post.media.forEach(mediaPath => {
                const fullPath = path.join(__dirname, '..', mediaPath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            });
        }

        await Post.findByIdAndDelete(req.params.postId);
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Update post
router.put('/:postId', upload.array('media', 10), async (req, res) => {
    try {
        const { content } = req.body;
        const postId = req.params.postId;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Process new uploaded files
        const newMediaUrls = req.files ? req.files.map(file => {
            return file.path.replace(/^uploads[\/\\]/, '').replace(/\\/g, '/');
        }) : [];

        // Combine existing media with new media
        const updatedMediaUrls = [...(post.media || []), ...newMediaUrls.map(url => `uploads/${url}`)];

        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            {
                content,
                media: updatedMediaUrls
            },
            { new: true }
        );

        res.status(200).json(updatedPost);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

module.exports = router;