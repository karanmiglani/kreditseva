const loadMoreButton = document.getElementById('blLoadMore');
const blogGrid = document.getElementById('blGrid');
const skeletons = document.getElementById('blSkeletons');

const tabs = document.querySelectorAll('.bl-tab');

let offset = 20;
let currentCategory = 'all';


// =========================
// FILTER FUNCTION
// =========================

function applyFilter(category){

    currentCategory = category;

    const cards = document.querySelectorAll('.bl-card');

    cards.forEach(card => {

        if(
            category === 'all' ||
            card.dataset.cat === category
        ){
            card.style.display = 'block';
        }else{
            card.style.display = 'none';
        }

    });

}


// =========================
// TAB FILTERS
// =========================

tabs.forEach(tab => {

    tab.addEventListener('click', (e) => {

        tabs.forEach(btn =>
            btn.classList.remove('active')
        );

        e.currentTarget.classList.add('active');

        const category =
            e.currentTarget.dataset.cat;

        applyFilter(category);

    });

});


// =========================
// LOAD MORE BLOGS
// =========================

loadMoreButton.addEventListener('click', async function(){

    skeletons.style.display = 'grid';

    try {

        const resp = await fetch(
            `/load-more?offset=${offset}`
        );

        const data = await resp.json();

        data.blogs.forEach(blog => {

            blogGrid.innerHTML += `

            <a
              href="/blog/${blog.slug}"
              class="bl-card"
              data-cat="${blog.category}"
            >

              <div class="bl-card-img">

                <img
                  src="/${blog.featured_image}"
                  alt="${blog.title}"
                />

                <span class="blc-badge blc-business">

                  ${blog.category
                    .split('-')
                    .map(word =>
                      word.charAt(0).toUpperCase() + word.slice(1)
                    )
                    .join(' ')}

                </span>

              </div>

              <div class="bl-card-body">

                <h3>${blog.title}</h3>

                <p>${blog.meta_desc}</p>

                <div class="bl-card-meta">

                  <span>
                    <i class="fa-regular fa-calendar"></i>

                    ${new Date(blog.created_at)
                        .toLocaleDateString()}
                  </span>

                  <span>
                    <i class="fa-regular fa-clock"></i>

                    ${blog.read_time} min
                  </span>

                </div>

              </div>

            </a>

            `;

        });

        // Re-apply active filter
        applyFilter(currentCategory);

        offset += 20;

        // Hide button if no more blogs
        if(data.blogs.length < 20){
            loadMoreButton.style.display = 'none';
        }

    } catch (error) {

        console.log(error);

    } finally {

        skeletons.style.display = 'none';

    }

});