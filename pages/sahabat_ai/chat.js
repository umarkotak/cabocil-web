import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Mic, Send, Bot, User, Volume2, VolumeX } from 'lucide-react'
import 'regenerator-runtime/runtime'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import Markdown from 'react-markdown'
import { sentenceCase } from 'sentence-case'
import { Toaster, toast } from 'sonner'

// UI Components (assuming you use shadcn/ui or similar)
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// Dynamically import the player to avoid SSR issues
const ReactPlayerCsr = dynamic(() => import('@/components/ReactPlayerCsr'), { ssr: false })

// Sentence tokenizer
const tokenizer = require('sbd')
const sentenceSplitterOpt = {
  "newline_boundaries" : true,
  "html_boundaries"    : false,
  "sanitize"           : true,
  "allowed_tags"       : false,
  "preserve_whitespace" : false,
  "abbreviations"      : null
}

export default function Home() {
  // --- STATE MANAGEMENT ---
  const [userInput, setUserInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! How can I help you today?" }
  ])
  const [avatarState, setAvatarState] = useState('idle')
  const [isLoading, setIsLoading] = useState(false)
  const [isMuted, setIsMuted] = useState(false) // Mute state for TTS

  const chatContainerRef = useRef(null)
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition()

  // --- AVATAR & SPEECH SYNTHESIS ---
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null
  const [voices, setVoices] = useState([])

  useEffect(() => {
    if (synth) {
      const loadVoices = () => {
        const availableVoices = synth.getVoices()
        if (availableVoices.length > 0) {
          setVoices(availableVoices)
        }
      }
      loadVoices()
      synth.onvoiceschanged = loadVoices
    }
  }, [synth])

  const nativeSpeak = useCallback((text) => {
    if (isMuted || !text || !synth) {
      setAvatarState('idle')
      return
    }

    setAvatarState('talk')
    synth.cancel() // Cancel any previous speech

    const cleanedText = removeEmojis(removeEmoticons(text))
    const sentences = tokenizer.sentences(cleanedText, sentenceSplitterOpt)

    sentences.forEach((sentence, index) => {
      const utterance = new SpeechSynthesisUtterance(sentence)
      const googleIndonesianVoice = voices.find(v => v.lang === "id-ID" && v.name.includes("Google"))

      utterance.voice = googleIndonesianVoice || voices.find(v => v.lang === "id-ID")
      utterance.lang = "id-ID"
      utterance.rate = 1
      utterance.pitch = 1

      // Set the avatar to idle only after the very last sentence is spoken
      if (index === sentences.length - 1) {
        utterance.onend = () => {
          setAvatarState('idle')
        }
      }

      synth.speak(utterance)
    })
  }, [voices, synth, isMuted])

  // --- MESSAGE HANDLING ---
  const handleSendMessage = useCallback(async (messageContent) => {
    if (!messageContent.trim()) return

    setIsLoading(true)
    resetTranscript()
    setUserInput('')

    const newUserMessage = { role: 'user', content: messageContent }
    const currentMessages = [...messages, newUserMessage]
    setMessages(currentMessages)

    // Stop any ongoing speech
    if (synth) synth.cancel()
    setAvatarState('idle')

    // --- API Call Simulation ---
    // In a real app, you would make your API call here.
    // const response = await cabocilAPI.PostAIChat(...)
    // For now, we simulate a delay and a canned response.
    await new Promise(resolve => setTimeout(resolve, 1500))
    const aiResponseText = "BCA Expo adalah pameran tahunan yang digelar oleh Bank Central Asia (BCA) untuk membantu masyarakat mewujudkan impian seperti memiliki hunian, mobil, dan motor. Acara ini dilaksanakan dalam format hybrid, yaitu offline dan online."
    // --- End of API Call Simulation ---

    const newAssistantMessage = { role: 'assistant', content: aiResponseText }
    setMessages([...currentMessages, newAssistantMessage])

    setIsLoading(false)
    nativeSpeak(aiResponseText)

  }, [messages, nativeSpeak, resetTranscript, synth])

  // --- SPEECH RECOGNITION ---
  const startListening = () => {
    if (listening) {
      SpeechRecognition.stopListening()
    } else {
      if (synth) synth.cancel()
      setAvatarState('idle')
      resetTranscript()
      SpeechRecognition.startListening({ continuous: true, language: 'id-ID' })
    }
  }

  // Effect to process speech when user stops talking
  useEffect(() => {
    if (!listening && transcript) {
      handleSendMessage(transcript)
    }
  }, [listening, transcript, handleSendMessage])

  // --- UI EFFECTS ---
  // Auto-scroll chat to the bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current
      chatContainerRef.current.scrollTop = scrollHeight - clientHeight
    }
  }, [messages, isLoading])

  // Browser support check
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      toast.error("Oops! Your browser doesn't support speech recognition.")
    }
  }, [browserSupportsSpeechRecognition])


  const idleVideo = '/videos/ai2-idle.mp4'
  const talkVideo = '/videos/ai2-talk.mp4'

  return (
    <>
      <Toaster position="top-center" richColors />
      <main className="bg-gray-900 text-white min-h-[calc(100vh-70px)] flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col md:flex-row gap-6">

          {/* AVATAR VIDEO PLAYER */}
          <Card className="bg-gray-800 border-gray-700 shadow-2xl shadow-purple-500/10">
            <div className="h-[700px] relative w-full aspect-[4/5] rounded-t-lg overflow-hidden">
              <ReactPlayerCsr
                src={idleVideo}
                playing={true}
                loop={true}
                muted={true}
                width="100%"
                height="100%"
                className="absolute top-0 left-0 transition-opacity duration-500"
                style={{ opacity: avatarState === 'idle' ? 1 : 0 }}
              />
              <ReactPlayerCsr
                src={talkVideo}
                playing={true}
                loop={true}
                muted={true}
                width="100%"
                height="100%"
                className="absolute top-0 left-0 transition-opacity duration-500"
                style={{ opacity: avatarState === 'talk' ? 1 : 0 }}
              />
              <div className="absolute top-4 right-4">
                <Button size="icon" variant="ghost" onClick={() => setIsMuted(!isMuted)}>
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </Button>
              </div>
            </div>
          </Card>

          {/* CHAT INTERFACE */}
          <Card className="bg-gray-800 border-gray-700 w-full shadow-2xl shadow-purple-500/10">
            <CardHeader>
              <CardTitle className="text-purple-300">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* CHAT MESSAGES */}
              <ScrollArea className="h-72 pr-4" ref={chatContainerRef}>
                <div className="flex flex-col gap-4">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.role === 'assistant' && (
                        <Avatar className="w-8 h-8 border-2 border-purple-400">
                          <AvatarFallback><Bot size={16}/></AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-xs md:max-w-sm rounded-xl px-4 py-2 text-sm ${
                        message.role === 'user'
                          ? 'bg-purple-600 text-white rounded-br-none'
                          : 'bg-gray-700 text-gray-200 rounded-bl-none'
                      }`}>
                        <Markdown>{message.content}</Markdown>
                      </div>
                      {message.role === 'user' && (
                        <Avatar className="w-8 h-8 border-2 border-gray-500">
                          <AvatarFallback><User size={16}/></AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-start gap-3 justify-start">
                       <Avatar className="w-8 h-8 border-2 border-purple-400">
                          <AvatarFallback><Bot size={16}/></AvatarFallback>
                        </Avatar>
                      <div className="bg-gray-700 rounded-xl rounded-bl-none px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-75"></span>
                          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-150"></span>
                          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-300"></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* CHAT INPUT */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage(userInput)
                }}
                className="flex items-center gap-2"
              >
                <Input
                  id="input_params"
                  value={listening ? sentenceCase(transcript) : userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={listening ? "Listening..." : "Type your message..."}
                  disabled={isLoading}
                  className="bg-gray-700 border-gray-600 focus-visible:ring-purple-500"
                />
                <Button type="submit" size="icon" disabled={isLoading || !userInput} aria-label="Send Message">
                  <Send size={20} />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant={listening ? "destructive" : "outline"}
                  onClick={startListening}
                  disabled={isLoading}
                  aria-label={listening ? "Stop Listening" : "Start Listening"}
                  className={listening ? 'border-red-500 text-red-500 animate-pulse' : 'border-gray-600'}
                >
                  <Mic size={20} />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}

// --- HELPER FUNCTIONS ---
function removeEmoticons(text) {
  const emoticonRegex = /[:;8=xX]['"`^]?[-o\*\^]?[\)\]\(\[dDpP\/\\|@3<>]/g
  return text.replace(emoticonRegex, '')
}

function removeEmojis(text) {
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu
  return text.replace(emojiRegex, '')
}