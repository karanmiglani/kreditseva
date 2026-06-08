

  const blogTableBody = document.getElementById('blogTableBody');
  const pagination = document.getElementById('pagination');
  const BASE_URL = window.location.origin;

  let currentPage = 1;
  const limit = 10;

  const categoryMaps = {
    'personal-loan' : 'Personal Loan',
    'business-loan' : 'Business Loan',
    'professional-loan' : 'Professional Loan',
    'secured-loan' : 'Secured Loan',
    'credit-score' : 'Credit Score',
    'investment' : 'Investment',
    'others' : 'Others',
  }



  async function getBlogs(page = 1){
    try{
      const resp = await fetch(`${BASE_URL}/api/blog/get-blogs?page=${page}&limit=${limit}`,{
        method : "GET",
        credentials : 'include'
      });
      const data = await resp.json();

      // Render Blogs
      blogTableBody.innerHTML = '';
      data.blogs.forEach((blog, index) => {
        blogTableBody.innerHTML +=  `
        <tr>
        <td>${((page -1) * limit + index + 1)}</td>
                 <td style="max-width:280px;">
            <span style="font-weight:700;color:#0d1547;display:block;white-space:normal;line-height:1.4;">${blog.title}</span>
          </td>
        <td>${categoryMaps[blog.category]}</td>
        <td>${blog.name}</td>
        <td>${new Date(blog.created_at).toLocaleDateString()}</td>
        <td>${statusBadge(blog.status)}</td>
        <td>
            <div class="tbl-actions">
              <a href="blog-editor?id=${blog.id}" class="tbl-btn" title="Edit">
                <i class="fa-solid fa-pen"></i>
              </a>
              <button class="tbl-btn tbl-btn--del" title="Delete" onclick="deleteBlogs(${blog.id})" data-id="${blog.id}">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
        `
      })

      renderPagination(data.totalPages, data.currentPage);
    }catch(err){
      console.log(err);
      blogTableBody.innerHTML = 'Error while fetching blogs....'
    }
  }

  getBlogs();


function renderPagination(totalPages, currentPage){

  pagination.innerHTML = '';

  // Prev Button
  if(currentPage > 1){

    pagination.innerHTML += `
      <button
        class="pg-btn"
        onclick="getBlogs(${currentPage - 1})"
      >
        Prev
      </button>
    `;

  }

  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);

  // First page
  if(startPage > 1){

    pagination.innerHTML += `
      <button
        class="pg-btn"
        onclick="getBlogs(1)"
      >
        1
      </button>
    `;

    if(startPage > 2){
      pagination.innerHTML += `<span>...</span>`;
    }

  }

  // Middle pages
  for(let i = startPage; i <= endPage; i++){

    pagination.innerHTML += `
      <button
        class="pg-btn ${i === currentPage ? 'active' : ''}"
        onclick="getBlogs(${i})"
      >
        ${i}
      </button>
    `;

  }

  // Last page
  if(endPage < totalPages){

    if(endPage < totalPages - 1){
      pagination.innerHTML += `<span>...</span>`;
    }

    pagination.innerHTML += `
      <button
        class="pg-btn"
        onclick="getBlogs(${totalPages})"
      >
        ${totalPages}
      </button>
    `;

  }

  // Next Button
  if(currentPage < totalPages){

    pagination.innerHTML += `
      <button
        class="pg-btn"
        onclick="getBlogs(${currentPage + 1})"
      >
        Next
      </button>
    `;

  }

}



  function statusBadge(status){
    if(status === 'published') return '<span class="badge badge--approved">Published</span>';
    return '<span class="badge badge--pending">Draft</span>';
  }


  async function deleteBlogs(blogId){
    try {
      const resp = await fetch(`${BASE_URL}/api/blog/delete-blog/${blogId}`, {
      method : 'DELETE',
      credentials : 'include'
    });

    const data = await resp.json();
    if(data.success){
      const btn = document.querySelector(`button[data-id="${blogId}"]`);
      if(btn){
        btn.closest('tr').remove();
      }
    }
    } catch (error) {
      console.error(error);
    }
  }