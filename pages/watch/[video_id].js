import { useRef, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
const ReactPlayerCsr = dynamic(() => import('@/components/ReactPlayerCsr'), { ssr: false })
import ReactPlayer from 'react-player'
import { useRouter } from 'next/router'
import {
  MediaController,
  MediaControlBar,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaVolumeRange,
  MediaPlaybackRateButton,
  MediaPlayButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaMuteButton,
  MediaFullscreenButton,
} from "media-chrome/react";

import VideoQuiz from '@/components/VideoQuiz'
import cabocilAPI from '@/apis/cabocil_api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

var minutes = 3.5
var mobileModeLimit = 470
var smallWebLimit = 1015

export default function Watch() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [videoPlayerHeight, setVideoPlayerHeight] = useState(0)
  const [mobileMode, setMobileMode] = useState(true)
  const [videoDetail, setVideoDetail] = useState({channel: {}})
  const [suggestionVideos, setSuggestionVideos] = useState([])
  const [blockVideoRecomm, setBlockVideoRecomm] = useState(false)
  const [quizTs, setQuizTs] = useState(0)
  const [openRecomendations, setOpenRecomendations] = useState(true)

  const videoPlayerDivRef = useRef()

  var rPlayerRef = useRef(null)
  const [playerPlaying, setPlayerPlaying] = useState(true)

  const intervalRef = useRef(null)

  // --- Start of added code ---
  const [videoDuration, setVideoDuration] = useState(0);
  const lastRecordedTimeRef = useRef(0);
  // --- End of added code ---


  useEffect(() => {
    if (typeof(window) === "undefined") { return }

    if (window.innerWidth <= mobileModeLimit) {
      setMobileMode(true)
    } else if (window.innerWidth <= smallWebLimit) {
      setMobileMode(false)
    } else {
      setMobileMode(false)
    }

    const onResize = () => {
      if (window.innerWidth <= mobileModeLimit) {
        setMobileMode(true)
      } else if (window.innerWidth <= smallWebLimit) {
        setMobileMode(false)
      } else {
        setMobileMode(false)
      }
    }

    window.addEventListener("resize", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
    }
  }, [])


  useEffect(() => {
    if (!videoPlayerDivRef.current) return
    const resizeObserver = new ResizeObserver(() => {
      if (!videoPlayerDivRef.current) return
      var res = Math.floor(videoPlayerDivRef.current.offsetWidth / (16 / 9))
      setVideoPlayerHeight(res)
    })
    resizeObserver.observe(videoPlayerDivRef.current)
    return () => resizeObserver.disconnect() // clean up
  }, [])

  useEffect(() => {
    if (!router.query.video_id) { return }

    GetVideoDetail(router.query.video_id)

    GetChannelVideos()

    if (localStorage && localStorage.getItem("COOKIEKID:QUIZ:ENABLE") !== "off") {
      setQuizTs(Date.now())
    }
  }, [router])

  async function GetVideoDetail(videoID) {
    try {
      const response = await cabocilAPI.GetVideoDetail("", {}, {
        youtube_video_id: videoID,
      })
      const body = await response.json()
      if (response.status !== 200) {
        return
      }

      setVideoDetail(body.data)
    } catch (e) {
      console.error(e)
    }
  }

  async function GetChannelVideos() {
    try {
      const response = await cabocilAPI.GetVideos("", {}, {
        limit: 50
      })
      const body = await response.json()
      if (response.status !== 200) {
        return
      }

      setSuggestionVideos(body.data.videos)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    const execCallback = () => {
      if (localStorage.getItem("COOKIEKID:QUIZ:ENABLE") === "off") {
        return
      }

      if (document) {
        try {
          if (document.fullscreenElement === null) {
          } else {
            document.exitFullscreen()
          }
        } catch(e) {}
      }

      setQuizTs(Date.now())
    }

    intervalRef.current = setInterval(execCallback, minutes * 60 * 1000)

    return () => clearInterval(intervalRef.current)
  }, [])

  async function RecordVideoWatchActivity(currentTs, maxTs) {
    cabocilAPI.PostUserActivity("", {}, {
      youtube_video_id: videoDetail.id,
      metadata: {
        current_progress: currentTs,
        min_progress: 0,
        max_progress: maxTs
      }
    })
  }

  // var sendInterval = 5 // in second
  const handleVideoProgress = (progress) => {
    // console.warn("tick", Math.floor(rPlayerRef.current.currentTime))

    const currentSeconds = Math.floor(rPlayerRef.current.currentTime);

    // if (currentSeconds > lastRecordedTimeRef.current + sendInterval) {
      RecordVideoWatchActivity(currentSeconds, Math.floor(rPlayerRef.current.duration));
      // Update the ref to the current time
      // lastRecordedTimeRef.current = currentSeconds;

      // console.warn("REF", Math.floor(rPlayerRef.current.currentTime), Math.floor(rPlayerRef.current.duration))
    // }
  };

  function handlePause() {
  }

  return (
    <main className='flex flex-col lg:flex-row gap-4 mt-[-8px] mx-[-8px] sm:mt-0 '>
      {/* <VideoQuiz ts={quizTs} setTs={setQuizTs} setPlayerPlaying={setPlayerPlaying} /> */}

      <div className='sticky top-[44px] z-10 md:block w-full bg-background'>
        <div className='w-full' ref={videoPlayerDivRef} id="video-content">
          <div className={`w-full md:relative overflow-hidden shadow-md`}>
            <div className='w-full' style={{height: `${videoPlayerHeight}px`}}>
              {/* <MediaController
                style={{
                  width: "100%",
                  aspectRatio: "16/9",
                }}
              >
                <ReactPlayer
                  slot="media"
                  ref={rPlayerRef}
                  src={`https://www.youtube.com/watch?v=${videoDetail.external_id}`}
                  style={{ width: '100%', height: '100%', "--controls": "none" }}
                  // playing={playerPlaying}
                  controls={false}
                  // --- Start of added/modified code ---
                  onProgress={handleVideoProgress}
                  // --- End of added/modified code ---
                  onPause={handlePause}
                />
                <MediaControlBar>
                  <MediaPlayButton />
                  <MediaSeekBackwardButton seekOffset={10} />
                  <MediaSeekForwardButton seekOffset={10} />
                  <MediaTimeRange />
                  <MediaTimeDisplay showDuration />
                  <MediaMuteButton />
                  <MediaVolumeRange />
                  <MediaPlaybackRateButton />
                  <MediaFullscreenButton />
                </MediaControlBar>
              </MediaController> */}
                <ReactPlayer
                  ref={rPlayerRef}
                  src={`https://www.youtube.com/watch?v=${videoDetail.external_id}`}
                  style={{ width: '100%', height: '100%' }}
                  playing={playerPlaying}
                  controls={true}
                  onProgress={handleVideoProgress}
                  onPause={handlePause}
                />
            </div>
            {/* <div
              className='absolute right-[55px] bottom-0 w-28 rounded h-8 bg-red-100 bg-opacity-0'
            ></div>
            <div
              className={`${blockVideoRecomm ? "absolute left-0 bottom-14 w-full bg-black bg-opacity-90 h-full" : ""}`}
            ></div> */}
          </div>
        </div>
        {/* {`https://www.youtube.com/watch?v=${videoDetail.external_id}`} */}
        <div className='hidden md:block'>
          <div className='p-1 mt-1'>
            <span className="font-semibold text-lg md:text-2xl leading-relaxed">{videoDetail.title}</span>
          </div>
          <div className={`flex justify-between items-center p-1 mt-1`}>
            <div className='flex items-center mr-2'>
              <Link href={`/channels/${videoDetail.channel.id}`} className='flex-none flex items-center gap-4 hover:bg-accent'>
                <Avatar>
                  <AvatarImage src={videoDetail.channel.image_url} />
                  <AvatarFallback><img src="/images/cookie_kid_logo_circle.png" /></AvatarFallback>
                </Avatar>
                <span className='text-sm font-semibold'>{videoDetail.channel.name}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div id="suggestion-content" className={`flex-none w-full ${openRecomendations ? "md:w-[402px]" : "md:w-[90px]"} flex flex-col gap-5 sm:h-[calc(100vh-60px)] sm:overflow-auto relative`}>
        <div className='hidden md:flex sticky top-0 bg-background z-10'>
          <Button size="sm7" onClick={()=>{setOpenRecomendations(!openRecomendations)}}>
            {openRecomendations ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
          </Button>
        </div>

        {suggestionVideos.map((oneVideo)=>(
          <div className='group flex flex-row gap-2 hover:text-amber-600' key={oneVideo.id}>
            <div className='flex-none w-[169px] h-[94px] overflow-hidden'>
              <Link href={`/watch/${oneVideo.id}`}>
                <img
                  className={`${mobileMode ? "" : ""} shadow-md w-full h-full group-hover:scale-105 group-hover:duration-100`}
                  src={oneVideo.image_url}
                  alt="thumb"
                />
              </Link>
            </div>
            <div className='w-full flex flex-col gap-2'>
              <Link
                href={`/watch/${oneVideo.id}`}
                className="font-medium text-[14px] leading-5 line-clamp-2 tracking-tight"
              >{oneVideo.title}</Link>
              <Link href={`/channels/${oneVideo.channel.id}`} className="flex flex-row gap-2 text-sm items-center">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={oneVideo.channel.image_url} />
                  <AvatarFallback><img src="/images/cookie_kid_logo_circle.png" /></AvatarFallback>
                </Avatar>
                <span className='flex-auto text-[12px] line-clamp-2'>{oneVideo.channel.name}</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}