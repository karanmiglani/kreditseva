
const BASE_URL = window.location.origin;
(function () {

  // =========================
  // URL Params
  // =========================
  const params = new URLSearchParams(window.location.search);
  const blogId = params.get('id');

  // =========================
  // DOM Elements
  // =========================
  const titleInput = document.getElementById('blogTitle');
  const slugPreview = document.getElementById('slugPreview');
  const metaTitleInput = document.getElementById('metaTitle');
  const metaDescInput = document.getElementById('metaDesc');
  const metaKeywordsInput = document.getElementById('metaKeywords');
  const statusInput = document.getElementById('blogStatus');
  const categoryInput = document.getElementById('blogCategory');
  const readTimeInput = document.getElementById('readTime');

  const imageUploadArea = document.getElementById('imgUploadArea');
  const imgPlaceholder = document.getElementById('imgPlaceholder');
  const imageInput = document.getElementById('featuredImg');
  const removeImageButton = document.getElementById('removeImgBtn');
  const imagePreview = document.getElementById('imgPreview');

  let selectedFile = null;
  let hasExistingImage = false;

  // =========================
  // TinyMCE Init
  // =========================
  tinymce.init({
    selector: '#blogEditor',
    base_url: '/admin/libs/tinymce/js/tinymce',
    suffix: '.min',
    height: 500,
    menubar: true,

    plugins: [
      'advlist',
      'autolink',
      'lists',
      'link',
      'image',
      'charmap',
      'preview',
      'anchor',
      'searchreplace',
      'visualblocks',
      'code',
      'fullscreen',
      'insertdatetime',
      'media',
      'table',
      'wordcount'
    ],

    toolbar:
      'undo redo | blocks | ' +
      'bold italic underline strikethrough | ' +
      'alignleft aligncenter alignright alignjustify | ' +
      'bullist numlist outdent indent | ' +
      'table link image | ' +
      'forecolor backcolor | ' +
      'fullscreen code',

    content_style:
      "body { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; color: #0d1547; line-height: 1.7; padding: 16px; }",

    table_advtab: true,
    table_cell_advtab: true,
    table_row_advtab: true,
    license_key: 'gpl',

    setup: function (editor) {

      // Read Time Auto Calculate
      editor.on('input', function () {

        const text = editor.getContent({ format: 'text' });

        const words = text
          .trim()
          .split(/\s+/)
          .filter(Boolean).length;

        const minutes = Math.max(1, Math.ceil(words / 200));

        readTimeInput.value = minutes;

        document.getElementById('readTimeAuto').textContent =
          `${words} words - auto calculated`;
      });
    },

    // TinyMCE Ready
    init_instance_callback: function () {

      if (blogId) {
        loadBlog();
      }
    }
  });

  // =========================
  // Load Blog
  // =========================
  async function loadBlog() {

    try {

      const resp = await fetch(
        `${BASE_URL}/api/blog/get-blog/${blogId}`,
        {
          method: 'GET',
          credentials: 'include'
        }
      );

      const data = await resp.json();

      if (!data.success) {
        showMsg(data.message, 'red');
        return;
      }

      // Fill Inputs
      titleInput.value = data.blog.title;
      slugPreview.textContent = data.blog.slug;

      metaTitleInput.value = data.blog.meta_title || '';
      metaDescInput.value = data.blog.meta_desc || '';
      metaKeywordsInput.value = data.blog.meta_keywords || '';
      statusInput.value = data.blog.status || '';
      categoryInput.value = data.blog.category || '';
      readTimeInput.value = data.blog.read_time || '';

      // TinyMCE Content
      tinymce.get('blogEditor').setContent(data.blog.content || '');

      // Meta Count
      document.getElementById('metaTitleCount').textContent =
        `${metaTitleInput.value.length} / 60`;

      document.getElementById('metaDescCount').textContent =
        `${metaDescInput.value.length} / 160`;

      // Featured Image Preview
      if (data.blog.featured_image) {
        hasExistingImage = true;

        imagePreview.src = `${data.blog.featured_image}`;

        imagePreview.style.display = 'block';

        imgPlaceholder.style.display = 'none';

        removeImageButton.style.display = 'inline-flex';
      }

    } catch (err) {

      console.log(err);

      showMsg('Failed to load blog', 'red');
    }
  }

  // =========================
  // Slug Generate
  // =========================
  titleInput.addEventListener('input', function () {

    const slug = this.value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    slugPreview.textContent =
      slug || 'blog-title-yahaan-aayega';
  });

  // =========================
  // Meta Title Count
  // =========================
  metaTitleInput.addEventListener('input', function () {

    document.getElementById('metaTitleCount').textContent =
      `${this.value.length} / 60`;
  });

  // =========================
  // Meta Desc Count
  // =========================
  metaDescInput.addEventListener('input', function () {

    document.getElementById('metaDescCount').textContent =
      `${this.value.length} / 160`;
  });

  // =========================
  // Image Upload Click
  // =========================
  imageUploadArea.addEventListener('click', function () {

    imageInput.click();
  });

  // =========================
  // Image Change
  // =========================
  imageInput.addEventListener('change', function (e) {

    const file = e.target.files[0];

    handleFile(file);
  });

  // =========================
  // Drag Over
  // =========================
  imageUploadArea.addEventListener('dragover', function (e) {

    e.preventDefault();

    imageUploadArea.classList.add('dragover');
  });

  // =========================
  // Drag Leave
  // =========================
  imageUploadArea.addEventListener('dragleave', function (e) {

    e.preventDefault();

    imageUploadArea.classList.remove('dragover');
  });

  // =========================
  // Drop
  // =========================
  imageUploadArea.addEventListener('drop', function (e) {

    e.preventDefault();

    imageUploadArea.classList.remove('dragover');

    const file = e.dataTransfer.files[0];

    handleFile(file);
  });

  // =========================
  // Remove Image
  // =========================
  removeImageButton.addEventListener('click', function () {

    selectedFile = null;
    hasExistingImage = false;

    imageInput.value = '';

    imagePreview.src = '';

    imagePreview.style.display = 'none';

    imgPlaceholder.style.display = 'flex';

    removeImageButton.style.display = 'none';
  });

  // =========================
  // Handle File
  // =========================
  function handleFile(file) {

    if (!file) return;

    const allowedTypes = [
      'image/jpg',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    // Type Check
    if (!allowedTypes.includes(file.type.toLowerCase())) {

      showMsg(
        'Only PNG, JPG, JPEG, WEBP allowed',
        'red'
      );

      return;
    }

    // Size Check
    if (file.size > 2 * 1024 * 1024) {

      showMsg(
        'File must be less than 2MB',
        'red'
      );

      return;
    }

    selectedFile = file;

    const reader = new FileReader();

    reader.onload = function (e) {

      imagePreview.src = e.target.result;

      imagePreview.style.display = 'block';

      imgPlaceholder.style.display = 'none';

      removeImageButton.style.display = 'inline-flex';
    };

    reader.readAsDataURL(file);
  }

  // =========================
  // Show Message
  // =========================
  function showMsg(msg, color) {

    const el = document.getElementById('saveMsg');

    el.textContent = msg;

    el.style.color =
      color === 'green'
        ? '#16a34a'
        : '#dc2626';

    setTimeout(function () {

      el.textContent = '';

    }, 4000);
  }

  // =========================
  // Save Draft
  // =========================
  document
    .getElementById('saveDraftBtn')
    .addEventListener('click', async function (e) {

      e.preventDefault();

      statusInput.value = 'draft';

      await submitForm();
    });

  // =========================
  // Publish Blog
  // =========================
  document
    .getElementById('blogForm')
    .addEventListener('submit', async function (e) {

      e.preventDefault();

      statusInput.value = 'published';

      await submitForm();
    });

  // =========================
  // Submit Form
  // =========================
  async function submitForm() {

    const title = titleInput.value.trim();

    const slug = slugPreview.textContent.trim();

    const content =
      tinymce.get('blogEditor').getContent();

    const metaTitle =
      metaTitleInput.value.trim();

    const metaDesc =
      metaDescInput.value.trim();

    const metaKeywords =
      metaKeywordsInput.value.trim();

    const status =
      statusInput.value;

    const category =
      categoryInput.value;

    const image =
      selectedFile;

    const readTime =
      readTimeInput.value;

    // Validation
    if (!title) {
      showMsg('Title is required', 'red');
      return;
    }

    if (!slug) {
      showMsg('Slug is required', 'red');
      return;
    }

    if (!content) {
      showMsg('Content is required', 'red');
      return;
    }

    if (!metaTitle) {
      showMsg('Meta Title is required', 'red');
      return;
    }

    if (!metaDesc) {
      showMsg('Meta Description is required', 'red');
      return;
    }

    if (!metaKeywords) {
      showMsg('Meta Keywords are required', 'red');
      return;
    }

    if (!status) {
      showMsg('Blog Status is required', 'red');
      return;
    }

    if (!category) {
      showMsg('Blog Category is required', 'red');
      return;
    }

    if (!readTime) {
      showMsg('Read Time is required', 'red');
      return;
    }

    if (!image && !hasExistingImage) {
      showMsg('Image is required', 'red');
      return;7
    }

    // Create FormData
    const formData = new FormData();

    formData.append('title', title);
    formData.append('slug', slug);
    formData.append('content', content);
    formData.append('metaTitle', metaTitle);
    formData.append('metaDesc', metaDesc);
    formData.append('metaKeywords', metaKeywords);
    formData.append('status', status);
    formData.append('category', category);
    formData.append('readTime', readTime);

    // Only append image if selected
    if (image) {
      formData.append('image', image);
    }

    try {

      const url = blogId
        ? `${BASE_URL}/api/blog/update-blog/${blogId}`
        : `${BASE_URL}/api/blog/add-blog`;

      const method = blogId
        ? 'PUT'
        : 'POST';

      const resp = await fetch(url, {
        method,
        credentials: 'include',
        body: formData
      });

      const data = await resp.json();

      console.log(data);

      if (data.success) {

        showMsg(data.message, 'green');

        setTimeout(() => {

          window.location.reload();

        }, 2000);

      } else {

        showMsg(data.message, 'red');
      }

    } catch (err) {

      console.log(err);

      showMsg(
        'Something went wrong',
        'red'
      );
    }
  }

})();

