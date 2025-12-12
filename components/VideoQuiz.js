

import Utils from '@/models/Utils'
import YtVideo from '@/models/YtVideo'
import { SettingsIcon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'

var MAX_WRONG_COUNT = 2
var currenstAnswerCount = 0

export default function VideoQuiz({
  ts, setTs, setPlayerPlaying
}) {
  const [show, setShow] = useState(false)
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState(null)
  const [activeQuizzes, setActiveQuizzes] = useState([])
  const [quizCurrIndex, setQuizCurrIndex] = useState(0)
  const [allowDismiss, setAllowDismiss] = useState(true)

  useEffect(() => {
    currenstAnswerCount = 0
    setAllowDismiss(localStorage.getItem("CABOCIL:QUIZ:ALLOW_DISMISS") !== "off")
  }, [])

  useEffect(() => {
    currenstAnswerCount = 0

    if (ts <= 0) {
      setShow(false)
      return
    }

    setSelectedAnswerIdx(null)
    // setActiveQuizzes(generateMatchWordAndVoiceQuizzes(3))
    setActiveQuizzes(generateMatchWordAndVoiceQuizzes(2))
    setQuizCurrIndex(0)

    setPlayerPlaying(false)
    setShow(true)
  }, [ts])

  function answerClick(e, idx) {
    setSelectedAnswerIdx(idx)

    Utils.SpeakText(activeQuizzes[quizCurrIndex].answers[idx].value)

    if (localStorage.getItem("CABOCIL:QUIZ:SHOW_ANSWER") !== "off") {
      if (`${e.target.textContent}` === `${idx + 1}`) {
        e.target.textContent = `${idx + 1}.`
      } else if (e.target.textContent.includes(".")) {
        e.target.textContent = activeQuizzes[quizCurrIndex].answers[idx].value
      }
    }

  }

  function submitAnswer() {
    var tmpActiveQuiz = activeQuizzes[quizCurrIndex]

    if (tmpActiveQuiz.question_type === "match_word_and_voice") {
      if (!tmpActiveQuiz.answers[selectedAnswerIdx]) { return }

      if (localStorage.getItem("CABOCIL:QUIZ:CHANGE_QUESTION_ON_WRONG") !== "off") {
        if (currenstAnswerCount >= MAX_WRONG_COUNT) {
          Utils.SpeakText("KAMU HARUS MENGULANG!")
          setTs(Date.now())
          return
        }
      }

      if (tmpActiveQuiz.question.value === tmpActiveQuiz.answers[selectedAnswerIdx].value) {
        Utils.SpeakText("JAWABANMU BENAR!")
        currenstAnswerCount = 0

        if (quizCurrIndex == activeQuizzes.length - 1) {
          setShow(false)
          setPlayerPlaying(true)
        }

        setQuizCurrIndex(quizCurrIndex + 1)
      } else {
        Utils.SpeakText("JAWABANMU SALAH!")
        currenstAnswerCount += 1
      }
    }
  }

  return (
    <div className={`${show ? "block" : "hidden"}`}>
      <div className={`w-full h-screen fixed top-0 left-0 backdrop-blur-md bg-black bg-opacity-80 z-50`} />
      <div className='fixed top-6 left-0 right-0 mx-auto rounded-lg overflow-hidden h-4/5 max-w-lg w-full z-50'>
        <Card>
          <CardHeader>
            <div className='flex justify-between items-center'>
              <Button variant="outline">Waktunya Quiz!!!</Button>
              {allowDismiss &&
                <div className='flex gap-2'>
                  <Link href="/setting"><Button variant="outline"><SettingsIcon /></Button></Link>
                  <Button onClick={() => { setShow(false) }} variant="outline"><XIcon /></Button>
                </div>
              }
            </div>
          </CardHeader>
          <CardContent>
            <div id="box_title" className='flex justify-center text-lg mt-8'>
              {activeQuizzes[quizCurrIndex]?.question_message}
            </div>
            <div id="box_question" className='flex justify-center text-lg mt-28'>
              <span className='text-[110px] ' style={{ fontFamily: "'Muli', sans-serif" }}>
                {activeQuizzes[quizCurrIndex]?.question.value}
              </span>
            </div>
            <div id="box_answer" className='grid grid-cols-2 mt-20 p-3 gap-4'>
              {activeQuizzes[quizCurrIndex]?.answers.map((v, idx) => (
                <Button
                  variant={`${selectedAnswerIdx == idx ? "default" : "outline"}`}
                  onClick={(e) => { answerClick(e, idx) }}
                  key={`${idx}-${v.value}`}
                  style={{ fontFamily: "'Muli', sans-serif" }}
                >
                  {idx + 1}
                </Button>
              ))}
            </div>
            <div id="box_submit" className='flex justify-between items-center p-3'>
              <div className='text-lg'>
                Pertanyaan <span className='font-bold'>{quizCurrIndex + 1}</span> Dari {activeQuizzes.length}
              </div>
              <Button onClick={() => submitAnswer()}>
                JAWAB
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

var wordList = [
  "a ba", "ba ba", "ca ca", "da da", "fa da", "ka ka",
]

var letterNonVoc = ["b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "q", "r", "s", "t", "v", "w", "x", "y", "z"]
// var letterVoc = ["a", "i", "u", "e", "o"]
var letterVoc = ["a", "i"]

function generateMatchWordAndVoiceQuizzes(numQuizz) {
  var generatedQuizzes = []

  for (let index = 1; index <= numQuizz; index++) {
    // var qVal = pickRandom(wordList)
    var qVal = generateRandomWord()

    var tmpQuestion = {
      question_type: "match_word_and_voice",
      question_message: "Pilih mana suara yang tepat",
      answer_type: "multiple_choice",
      question: {
        value: qVal
      },
      answers: [
        { value: qVal, display: "1", },
        { value: generateRandomWord(), display: "2", },
        { value: generateRandomWord(), display: "3", },
        { value: generateRandomWord(), display: "4", },
      ],
    }

    tmpQuestion.answers = shuffleArray(tmpQuestion.answers)
    generatedQuizzes.push(tmpQuestion)
  }

  return generatedQuizzes
}

var quizzes = [
  {
    question_type: "match_word_and_voice",
    question_message: "Pilih mana suara yang tepat",
    answer_type: "multiple_choice",
    question: {
      value: "ba ba"
    },
    answers: [
      { value: "ba ba", display: "1", },
      { value: "ca ca", display: "2", },
      { value: "da da", display: "3", },
      { value: "fa fa", display: "4", },
    ],
  },
  {
    question_type: "match_word_and_voice",
    question_message: "Pilih mana suara yang tepat",
    answer_type: "multiple_choice",
    question: {
      value: "ca ca"
    },
    answers: [
      { value: "ya ya", display: "1", },
      { value: "ca ca", display: "2", },
      { value: "da da", display: "3", },
      { value: "fa fa", display: "4", },
    ],
  },
]

function pickRandom(array) {
  // Check if the array is empty
  if (array.length === 0) {
    return null;
  }

  // Generate a random index within the range of the array's length
  const randomIndex = Math.floor(Math.random() * array.length);

  // Return the element at the random index
  return array[randomIndex];
}

function shuffleArray(array) {
  // Create a copy of the array to avoid modifying the original
  const shuffledArray = [...array];

  // Iterate over the array
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    // Generate a random index within the range of the array's length
    const randomIndex = Math.floor(Math.random() * (i + 1));

    // Swap the element at the current index with the element at the random index
    const temp = shuffledArray[i];
    shuffledArray[i] = shuffledArray[randomIndex];
    shuffledArray[randomIndex] = temp;
  }

  // Return the shuffled array
  return shuffledArray;
}

function generateRandomWord() {
  return `${pickRandom(letterNonVoc)}${pickRandom(letterVoc)} ${pickRandom(letterNonVoc)}${pickRandom(letterVoc)}`
}
