import React, { useState } from 'react';
import { Brain, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { QuizQuestion } from '../../types/networking';
import { quizQuestions } from '../../data/sampleData';

export const InteractiveQuiz: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState<boolean[]>(
    new Array(quizQuestions.length).fill(false)
  );

  const question = quizQuestions[currentQuestion];
  const isCorrect = selectedAnswer === question.correctAnswer;
  const isCompleted = completedQuestions.every(q => q);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    if (answerIndex === question.correctAnswer && !completedQuestions[currentQuestion]) {
      setScore(score + 1);
    }
    
    const newCompleted = [...completedQuestions];
    newCompleted[currentQuestion] = true;
    setCompletedQuestions(newCompleted);
  };

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setCompletedQuestions(new Array(quizQuestions.length).fill(false));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Brain className="h-6 w-6 text-purple-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">
            Interactive Quiz
          </h2>
        </div>
        <div className="text-sm text-gray-600">
          Score: {score}/{completedQuestions.filter(q => q).length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            Question {currentQuestion + 1} of {quizQuestions.length}
          </span>
          <span className="text-sm text-gray-600">
            {Math.round(((currentQuestion + 1) / quizQuestions.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {!isCompleted && (
        <>
          {/* Question */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {question.question}
            </h3>
            
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showExplanation}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                    showExplanation
                      ? index === question.correctAnswer
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : selectedAnswer === index
                        ? 'border-red-500 bg-red-50 text-red-800'
                        : 'border-gray-200 bg-gray-50 text-gray-600'
                      : 'border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50 text-gray-800'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="w-6 h-6 rounded-full border-2 border-current mr-3 flex items-center justify-center text-sm font-semibold">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                    {showExplanation && (
                      <div className="ml-auto">
                        {index === question.correctAnswer ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : selectedAnswer === index ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : null}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className={`p-4 rounded-lg mb-6 ${
              isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <div className="flex items-start">
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold mb-1">
                    {isCorrect ? 'Correct!' : 'Not quite right.'}
                  </p>
                  <p>{question.explanation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            {showExplanation && (
              <button
                onClick={handleNext}
                disabled={currentQuestion === quizQuestions.length - 1}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {currentQuestion === quizQuestions.length - 1 ? 'Finish' : 'Next Question'}
              </button>
            )}
          </div>
        </>
      )}

      {/* Quiz Completion */}
      {isCompleted && (
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Quiz Complete!
            </h3>
            <p className="text-lg text-gray-600 mb-4">
              You scored {score} out of {quizQuestions.length} questions correctly.
            </p>
            
            {score === quizQuestions.length && (
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <p className="text-yellow-800 font-semibold">
                  🎉 Perfect score! You have a solid understanding of networking basics!
                </p>
              </div>
            )}
            
            {score >= quizQuestions.length * 0.7 && score < quizQuestions.length && (
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <p className="text-green-800">
                  Great job! You have a good grasp of networking concepts.
                </p>
              </div>
            )}
            
            {score < quizQuestions.length * 0.7 && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-blue-800">
                  Good effort! Review the networking basics section and try again.
                </p>
              </div>
            )}
          </div>
          
          <button
            onClick={resetQuiz}
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Retake Quiz
          </button>
        </div>
      )}
    </div>
  );
};