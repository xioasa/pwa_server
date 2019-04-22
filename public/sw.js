
// const CACHE_FILE = [
//   '/',
//   './index.css',
//   './index.html',
//   './index.js',
// ];

// self.addEventListener('install', (event) => {
//   // 如果安装成功，调用event.waitUntil
//    event.waitUntil(
//      caches.open('cache-v1').then((cache) => {
//       //  缓存文件内容
//       return cache.addAll(CACHE_FILE);
//      })
//    )
// } );

// self.addEventListener('fetch', (event) => {
//   // respondWidth() 方法劫持http请求
//   event.respondWidth(
//        caches.match(event.request).then((response) => {
//          console.log(event.request);

//         // 如果资源被缓存过，直接从caches中获取
//         if (response) {
//           return response;
//         }

//         // 如果server worker 没有返回，直接从真实远程服务器获取
//         const request = event.request.clone(); // 拷贝原始请求
//         return fetch(resquest).then((httpRes) => {

//           // httpsRes 获取到响应数据

//           // 请求失败
//           if (!httpRes || httpRes.status !== 200) {
//             return httpRes;
//           }

//           // 请求成功

//           // 保存到server worker里
//           const responseClone = httpRes.clone();
//           caches.open('cache-v1').then((cache) => {
//             cache.put(event.request, responseClone);
//           });

//           return httpRes;
//         })

//        })
//   )
// })



// configuration
`use strict`;


/**
 * serverWork 配置详情
 * */
const cacheStorageKey = '1.1.0'; // 缓存key, 根据key是否一样来判断是否清楚之前缓存
const offlineURL = '/offline/',   // 当离线时用户试图访问之前未缓存的页面时，这个页面会呈现给用户。

  /**
   *  installFilesEssential: 1.离线功能的页面必要文件的数组
   *                         2. 应该包含静态文件 css\js\img
   *                         3. 要把文件主页（/）和图标文件写进去
   *                         4.如果有多个主页文件入口都要加上 如 '/'和 '/index'
   *                         5. offlineURL 也要被写进去
   *
   *
   * */

  installFilesEssential = [
    '/',
    '/manifest.json',
    '/css/styles.css',
    '/js/main.js',
    '/js/offlinepage.js',
    '/images/logo/logo152.png'
  ].concat(offlineURL),

  /**
   *  installFilesDesirable: 可选的 描述文件数组，这写文件都会被下载
   */

  installFilesDesirable = [
    '/',
    './index.css',
    './index.html',
    './index.js',
  ];

/**
 * installStaticFiles 添加文件到缓存。该函数当有返回值时，表明所有的必要文件都被缓存成功
 *
 * */

function installStaticFiles() {

  return caches.open(cacheStorageKey)
    .then(cache => {

      // 缓存文件
      return cache.addAll(installFilesDesirable);

      // 缓存基本文件
      // return cache.addAll(installFilesEssential);

    });

}



// 清除旧缓存
function clearOldCaches() {

  return caches.keys()
    .then(keylist => {

      return Promise.all(
        keylist
          .filter(key => key !== cacheStorageKey)
          .map(key => caches.delete(key))
      );

    });

}



// 注册serviceWorker
self.addEventListener('install', event => {

  console.log('service worker: install');

  // 注册成功之后 缓存核心文件
  event.waitUntil(
    installStaticFiles()
      .then(() => self.skipWaiting())
  );

});


// 应用被激活
self.addEventListener('activate', event => {

  console.log('service worker: activate');

  // 删除旧缓存
  event.waitUntil(
    clearOldCaches()
      .then(() => self.clients.claim())
  );

});


// is image URL?
let iExt = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].map(f => '.' + f);
function isImage(url) {

  return iExt.reduce((ret, ext) => ret || url.endsWith(ext), false);

}


// 当处在离线时，并且没有缓存
function offlineAsset(url) {

  if (isImage(url)) {   // 返回静态资源

    // return image
    return new Response(
      '<svg role="img" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><title>offline</title><path d="M0 0h400v300H0z" fill="#eee" /><text x="200" y="150" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="50" fill="#ccc">offline</text></svg>',
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-store'
        }
      }
    );

  }
  else { // 返回离线显示的页面

    return caches.match(offlineURL);

  }

}


// 从服务端获取数据
self.addEventListener('fetch', event => {

  // 放弃不是get请求
  if (event.request.method !== 'GET') return;

  let url = event.request.url;

  event.respondWith(

    caches.open(cacheStorageKey)
      .then(cache => {

        return cache.match(event.request)
          .then(response => {

            // 判断缓存中是否存在请求的数据

            // 缓存中存在数据，则从缓存中读取
            if (response) {
              // 返回缓存的文件
              console.log('cache fetch: ' + url);
              return response;
            }

            // make network request
            // 缓存中不存在数据，向服务端获取数据
            return fetch(event.request)
              .then(newreq => {

                console.log('network fetch: ' + url);
                if (newreq.ok) cache.put(event.request, newreq.clone());
                return newreq;

              })
              // 处在离线时
              .catch(() => offlineAsset(url));
          });

      })

  );

});
