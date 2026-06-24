const db = require('../config/db');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const sanitizeBlogContent = require('../utils/sanitizeBlogContent');


const createBlog = async (req, resp) => {
    let imagePath = null;
    try{
    const { title , slug, content, metaTitle, metaDec, metaKeywords, status, category, readTime} = req.body;
    const safeContent = sanitizeBlogContent(content);

    if(req.file){

        const uploadPath = path.join(__dirname,'../../images/blog' );

        // create folder if not exists
        if(!fs.existsSync(uploadPath)){
            fs.mkdirSync(uploadPath, {recursive : true});
        }

        // unique image name
        const imageName = `blog-${Date.now()}.webp`;
        imagePath = `/images/blog/${imageName}`;
          // Optimize
        await sharp(req.file.buffer).resize({ width : 1200, withoutEnlargement : true }).webp({ quality : 80}).toFile(path.join(uploadPath, imageName));
    }
        const query = `INSERT INTO blogs(
        title,
        slug,
        content,
        category,
        status,
        featured_image,
        meta_title,
        meta_desc,
        meta_keywords,
        read_time,
        author_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const author_id = req.admin.id;
        const values = [title, slug, safeContent, category, status, imagePath, metaTitle, metaDec, metaKeywords, readTime, author_id];
        const [result] = await db.query(query,values);

        
        if(result.affectedRows === 0){
            return resp.status(400).json({
                success : false,
                message : 'Blog not created, Please try again'
            })
        }

      
        return resp.status(201).json({
            success : true,
            message : 'Blog created Successfully'
        })
    }catch(err){
        console.log(err);
        if(imagePath){
            const fullPath = path.join(__dirname, '../../',imagePath);
            if(fs.existsSync(fullPath)){
                fs.unlinkSync(fullPath);
            }
        }
        if(err.code === 'ER_DUP_ENTRY'){
            return resp.status(400).json({
                success : false,
                message : 'Blog with same title name already exists'
            });
        }
        return resp.status(500).json({
            success : false,
            message : 'Server error, Please try again....'
        })
    }
}


const getAllBlogs = async(req, resp) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const sql = "Select blogs.id, blogs.title, blogs.category , blogs.created_at, blogs.status, admins.name from blogs inner join admins on blogs.author_id = admins.id ORDER BY blogs.created_at DESC LIMIT ? OFFSET ?";
        const sql_1 = "SELECT COUNT(*) as total from blogs";
        const [countResult] = await db.query(sql_1);
        const [results] = await db.query(sql,[limit, offset]);
        const totalBlogs =  countResult[0].total;
        return resp.status(200).json({
            success : true,
            message : results.length > 0 ? 'Blogs found' : 'No Blogs found.....',
            currentPage : page,
            totalPages : Math.ceil(totalBlogs / limit),
            totalBlogs : totalBlogs,
            limit : limit,
            blogs : results
        })
    } catch (error) {
        console.log(error);
        return resp.status(500).json({ success : false , message : 'Server error, Please try again....' })
    }
}


const getBlog = async(req, resp) => {
    const blogId = parseInt(req.params.id);
    if(!blogId){
        return resp.status(400).json({
            success : false,
            message : 'Invalid Blog Id'
        });
    }

        try {
            const sql = `SELECT  *  from blogs where blogs.id=?`;
            const [result] = await db.query(sql,[blogId]);
            if(result.length === 0){
                return resp.status(400).json({
                    success : false,
                    message : 'No blog found...'
                });
            }
            return resp.status(200).json({
                success : true,
                message : 'Blog Found',
                blog : result[0]
            })
        } catch (error) {
            console.log(err);
            return resp.json({
                success : false,
                message : 'Server Error, Please try again....'
            })
        }
}



const updateBlog = async(req, resp) => {

    let newImagePath = null;

    try {

        const blogId = req.params.id;

        const {
            title,
            slug,
            content,
            metaTitle,
            metaDesc,
            metaKeywords,
            status,
            category,
            readTime
        } = req.body;

        const safeContent = sanitizeBlogContent(content);

        // Check blog exists
        const [blogRows] = await db.query(
            "SELECT * FROM blogs WHERE id = ?",
            [blogId]
        );

        if(blogRows.length === 0){

            return resp.status(404).json({
                success : false,
                message : 'Blog not found....'
            });
        }

        const existingBlog = blogRows[0];

        // =========================
        // Duplicate Slug Check
        // =========================
        const [slugRows] = await db.query(
            "SELECT * FROM blogs WHERE slug = ? AND id != ?",
            [slug, blogId]
        );

        if(slugRows.length > 0){

            return resp.status(400).json({
                success : false,
                message : 'Slug already exists'
            });
        }

        // =========================
        // Default Old Image
        // =========================
        let imagePath = existingBlog.featured_image;

        // =========================
        // If User Uploads New Image
        // =========================
        if(req.file){

            const uploadPath = path.join(__dirname,'../../images/blog' );

            // Create folder
            if(!fs.existsSync(uploadPath)){

                fs.mkdirSync(uploadPath, {
                    recursive : true
                });
            }

            // New Image Name
            const imageName =
                `blog-${Date.now()}.webp`;

            newImagePath =
                `/images/blog/${imageName}`;

            // Optimize Image
            await sharp(req.file.buffer)
                .resize({
                    width : 1200,
                    withoutEnlargement : true
                })
                .webp({
                    quality : 80
                })
                .toFile(
                    path.join(uploadPath, imageName)
                );

            // Update Image Path
            imagePath = newImagePath;

            // =========================
            // Delete Old Image
            // =========================
            if(existingBlog.featured_image){

                const oldImageFullPath = path.join(
                    __dirname,
                    '../../',
                    existingBlog.featured_image
                );

                if(fs.existsSync(oldImageFullPath)){

                    fs.unlinkSync(oldImageFullPath);
                }
            }
        }

        // =========================
        // Update Query
        // =========================
        const query = `
            UPDATE blogs
            SET
                title = ?,
                slug = ?,
                content = ?,
                category = ?,
                status = ?,
                featured_image = ?,
                meta_title = ?,
                meta_desc = ?,
                meta_keywords = ?,
                read_time = ?
            WHERE id = ?
        `;

        const values = [
            title,
            slug,
            safeContent,
            category,
            status,
            imagePath,
            metaTitle,
            metaDesc,
            metaKeywords,
            readTime,
            blogId
        ];

        const [result] = await db.query(
            query,
            values
        );

        // =========================
        // Check Update Success
        // =========================
        if(result.affectedRows === 0){

            return resp.status(400).json({
                success : false,
                message : 'Blog not updated'
            });
        }

        return resp.status(200).json({
            success : true,
            message : 'Blog updated successfully'
        });

    } catch(err){

        console.log(err);

        // =========================
        // Delete New Uploaded Image
        // If Error Happens
        // =========================
        if(newImagePath){

            const fullPath = path.join(
                __dirname,
                '../../',
                newImagePath
            );

            if(fs.existsSync(fullPath)){

                fs.unlinkSync(fullPath);
            }
        }

        return resp.status(500).json({
            success : false,
            message : 'Server error, Please try again....'
        });
    }
};


const deleteBlog = async(req , resp) => {
    const blogId = req.params.id;
    if(!blogId || isNaN(blogId)){
        return resp.json({
            success : false,
            message : 'No blog found....'
        })
    }
        try{
            console.log(blogId);
            const [row] = await db.query('Select featured_image from blogs where id = ?  ', [blogId]);
           if(row.length === 0){
            return resp.json({
            success : false,
            message : 'No blog found....'
        });
    }
    const imagePath = row[0].featured_image;
    const fullImagePath = path.join(__dirname,'../../',imagePath);
    const [rows] = await db.query('DELETE FROM blogs where id = ?',[blogId]);
    if(rows.affectedRows > 0){
        if(fullImagePath && fs.existsSync(fullImagePath)){
            await fs.promises.unlink(fullImagePath);
        }
    }
    return resp.status(200).json({
        success : true,
        message : 'Blog deleted successfully....'
    })
        }catch(err){
            console.log(err);
            return resp.status(500).json({
                success : false,
                message : 'Server error, Please try again...',

            })
    }

}

const insertDummyBlogs = async (req, resp) => {

    try {

        const blogs = [];

        for(let i = 1; i <= 100; i++){

            const uniqueSlug = `dummy-blog-${Date.now()}-${i}`;

            blogs.push([
                `Dummy Blog ${i}`,
                uniqueSlug,
                `This is dummy content for blog ${i}`,
                'personal-loan',
                i % 2 === 0 ? 'published' : 'draft',
                'images/blog/demo.webp',
                `Meta Title ${i}`,
                `Meta Description ${i}`,
                'finance,loan',
                5,
                1
            ]);

        }

        await db.query(
            `INSERT INTO blogs
            (
                title,
                slug,
                content,
                category,
                status,
                featured_image,
                meta_title,
                meta_desc,
                meta_keywords,
                read_time,
                author_id
            )
            VALUES ?`,
            [blogs]
        );

        return resp.status(200).json({
            success : true,
            message : '100 dummy blogs inserted successfully'
        });

    } catch(err){

        console.log(err);

        return resp.status(500).json({
            success : false,
            message : err.message
        });

    }

}




module.exports = {
    createBlog, getAllBlogs, getBlog, updateBlog, deleteBlog, insertDummyBlogs
}