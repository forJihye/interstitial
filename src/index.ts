import './index.css';

// https://ko.javascript.info/fetch-progress

interface PageSetting {
  type: 'iframe'|'video'
  src: string;
  duration: number;
  video?: string[];
}
interface Page {
  type: 'iframe'|'video'
  src: string;
  duration: number;
  el: HTMLElement;
  video?: HTMLVideoElement[];
}

const pageSetting: PageSetting[] = [
  {
    type: 'iframe',
    src: 'blue',
    duration: 5,
  },
  {
    type: 'video',
    src: 'yellow',
    duration: 5,
    video: ['https://hashsnap-static.s3.ap-northeast-2.amazonaws.com/file/video/kiosk-hera-2105.mp4']
  },
  {
    type: 'iframe',
    src: 'green',
    duration: 5
  }
]

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
const loadVideo = (src: string) => new Promise(res => {
  const video = document.createElement('video');
  video.oncanplay = () => res(video);
  video.onerror = () => res(null);
  video.muted = true;
  video.src = src;
})

const createPages = () => pageSetting.map(async (page, i) => {
  if (page.type === 'iframe') {
    const el = Object.assign(document.createElement('div'), {className: 'page', style: `background: ${page.src}`});
    return {...page, el, duration: page.duration * 1000};
  } else if (page.type === 'video') {
    const el = Object.assign(document.createElement('div'), {className: 'page', style: `background: ${page.src}`});
    if (page.video) {
      const videoLoaded = page.video.map(async (src) => await loadVideo(src));
      const video = await Promise.all(videoLoaded);
      return {...page, el, duration: page.duration * 1000, video};
    } else {
      return {...page, el, duration: page.duration * 1000};
    }
  }
}) as Promise<Page>[];

// // interstitial
const play = async (pages: Page[]) => {
  pages.forEach(({el}) => el.style.transition = 'opacity 0.5s');
  pages.forEach(({el}) => el.style.opacity = '0');
  
  let i = 0;
  const loop = async () => {
    const index = i++ % pages.length;
    const current = pages[index];
    if (current.el) {
      current.el.style.opacity = '1';
      if (current.video) {
        current.video.forEach(video => {
          video.currentTime = 0;
          video.play();
        });
      }
      await sleep(current.duration);
      loop();
      await sleep(500);
      current.el.style.opacity = '0';
      await sleep(500);
      if (current.video) {
        current.video.forEach(video => {
          video.currentTime = 0;
          video.pause();
        });
      }
    }
  }
  loop();
}

const main = async () => { try {
  const pages = await Promise.all(createPages())
  pages.forEach((page) => {
    const {type, el} = page;
    if (type === 'video') page.video?.forEach(v => el.appendChild(v));
    document.body.appendChild(el)
  });
  await play(pages);
} catch(err: any) {
  throw new Error(err)
}}

main();