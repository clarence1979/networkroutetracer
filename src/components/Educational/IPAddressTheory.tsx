import React, { useState } from 'react';
import { Server, Calculator, Eye, Globe, ArrowRight, CheckCircle, Plus, Minus, X, Divide, Equal, Delete } from 'lucide-react';

interface ConversionExample {
  decimal: string;
  binary: string;
  octal: string;
  hexadecimal: string;
}

interface Exercise {
  id: number;
  decimal: string;
  type: 'binary' | 'octal' | 'hexadecimal';
  userAnswer: string;
  isCorrect: boolean | null;
  showAnswer: boolean;
}

export const IPAddressTheory: React.FC = () => {
  const [selectedExample, setSelectedExample] = useState<string>('192.168.1.1');
  const [showCalculation, setShowCalculation] = useState<boolean>(false);
  const [calculatorDisplay, setCalculatorDisplay] = useState<string>('0');
  const [calculatorPrevious, setCalculatorPrevious] = useState<string>('');
  const [calculatorOperation, setCalculatorOperation] = useState<string>('');
  const [calculatorWaitingForOperand, setCalculatorWaitingForOperand] = useState<boolean>(false);
  const [exercises, setExercises] = useState<Exercise[]>([
    { id: 1, decimal: '192', type: 'binary', userAnswer: '', isCorrect: null, showAnswer: false },
    { id: 2, decimal: '168', type: 'octal', userAnswer: '', isCorrect: null, showAnswer: false },
    { id: 3, decimal: '255', type: 'hexadecimal', userAnswer: '', isCorrect: null, showAnswer: false },
    { id: 4, decimal: '10', type: 'binary', userAnswer: '', isCorrect: null, showAnswer: false },
    { id: 5, decimal: '172', type: 'octal', userAnswer: '', isCorrect: null, showAnswer: false },
    { id: 6, decimal: '254', type: 'hexadecimal', userAnswer: '', isCorrect: null, showAnswer: false },
  ]);

  const examples: ConversionExample[] = [
    {
      decimal: '192.168.1.1',
      binary: '11000000.10101000.00000001.00000001',
      octal: '300.250.001.001',
      hexadecimal: 'C0.A8.01.01'
    },
    {
      decimal: '8.8.8.8',
      binary: '00001000.00001000.00001000.00001000',
      octal: '010.010.010.010',
      hexadecimal: '08.08.08.08'
    },
    {
      decimal: '172.16.254.1',
      binary: '10101100.00010000.11111110.00000001',
      octal: '254.020.376.001',
      hexadecimal: 'AC.10.FE.01'
    }
  ];

  const getCurrentExample = (): ConversionExample => {
    return examples.find(ex => ex.decimal === selectedExample) || examples[0];
  };

  const convertDecimalToBinary = (decimal: number): string => {
    return decimal.toString(2).padStart(8, '0');
  };

  const convertDecimalToOctal = (decimal: number): string => {
    return decimal.toString(8).padStart(3, '0');
  };

  const convertDecimalToHex = (decimal: number): string => {
    return decimal.toString(16).toUpperCase().padStart(2, '0');
  };

  const getStepByStepConversion = (ipAddress: string) => {
    const octets = ipAddress.split('.').map(Number);
    
    return octets.map((octet, index) => ({
      decimal: octet,
      binary: convertDecimalToBinary(octet),
      octal: convertDecimalToOctal(octet),
      hexadecimal: convertDecimalToHex(octet),
      binarySteps: getBinaryConversionSteps(octet),
      octalSteps: getOctalConversionSteps(octet),
      hexSteps: getHexConversionSteps(octet)
    }));
  };

  const getBinaryConversionSteps = (decimal: number) => {
    const steps = [];
    let num = decimal;
    const powers = [128, 64, 32, 16, 8, 4, 2, 1];
    let binary = '';
    
    for (let i = 0; i < powers.length; i++) {
      if (num >= powers[i]) {
        binary += '1';
        steps.push(`${num} ≥ ${powers[i]} → write 1, remainder: ${num - powers[i]}`);
        num -= powers[i];
      } else {
        binary += '0';
        steps.push(`${num} < ${powers[i]} → write 0`);
      }
    }
    
    return { steps, result: binary };
  };

  const getOctalConversionSteps = (decimal: number) => {
    const steps = [];
    let num = decimal;
    let octal = '';
    
    if (num === 0) {
      return { steps: ['0 ÷ 8 = 0 remainder 0'], result: '000' };
    }
    
    while (num > 0) {
      const remainder = num % 8;
      steps.unshift(`${num} ÷ 8 = ${Math.floor(num / 8)} remainder ${remainder}`);
      octal = remainder + octal;
      num = Math.floor(num / 8);
    }
    
    return { steps, result: octal.padStart(3, '0') };
  };

  const getHexConversionSteps = (decimal: number) => {
    const steps = [];
    let num = decimal;
    let hex = '';
    const hexDigits = '0123456789ABCDEF';
    
    if (num === 0) {
      return { steps: ['0 ÷ 16 = 0 remainder 0'], result: '00' };
    }
    
    while (num > 0) {
      const remainder = num % 16;
      const hexDigit = hexDigits[remainder];
      steps.unshift(`${num} ÷ 16 = ${Math.floor(num / 16)} remainder ${remainder} (${hexDigit})`);
      hex = hexDigit + hex;
      num = Math.floor(num / 16);
    }
    
    return { steps, result: hex.padStart(2, '0') };
  };

  // Calculator functions
  const inputDigit = (digit: string) => {
    if (calculatorWaitingForOperand) {
      setCalculatorDisplay(digit);
      setCalculatorWaitingForOperand(false);
    } else {
      setCalculatorDisplay(calculatorDisplay === '0' ? digit : calculatorDisplay + digit);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(calculatorDisplay);

    if (calculatorPrevious === '') {
      setCalculatorPrevious(calculatorDisplay);
    } else if (calculatorOperation) {
      const currentValue = parseFloat(calculatorPrevious);
      const newValue = calculate(currentValue, inputValue, calculatorOperation);

      setCalculatorDisplay(String(newValue));
      setCalculatorPrevious(String(newValue));
    }

    setCalculatorWaitingForOperand(true);
    setCalculatorOperation(nextOperation);
  };

  const calculate = (firstOperand: number, secondOperand: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstOperand + secondOperand;
      case '-':
        return firstOperand - secondOperand;
      case '*':
        return firstOperand * secondOperand;
      case '/':
        return firstOperand / secondOperand;
      default:
        return secondOperand;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(calculatorDisplay);

    if (calculatorPrevious !== '' && calculatorOperation) {
      const currentValue = parseFloat(calculatorPrevious);
      const newValue = calculate(currentValue, inputValue, calculatorOperation);

      setCalculatorDisplay(String(newValue));
      setCalculatorPrevious('');
      setCalculatorOperation('');
      setCalculatorWaitingForOperand(true);
    }
  };

  const clearCalculator = () => {
    setCalculatorDisplay('0');
    setCalculatorPrevious('');
    setCalculatorOperation('');
    setCalculatorWaitingForOperand(false);
  };

  const clearEntry = () => {
    setCalculatorDisplay('0');
  };

  // Exercise functions
  const checkAnswer = (exerciseId: number) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const decimal = parseInt(exercise.decimal);
    let correctAnswer = '';

    switch (exercise.type) {
      case 'binary':
        correctAnswer = decimal.toString(2).padStart(8, '0');
        break;
      case 'octal':
        correctAnswer = decimal.toString(8).padStart(3, '0');
        break;
      case 'hexadecimal':
        correctAnswer = decimal.toString(16).toUpperCase().padStart(2, '0');
        break;
    }

    const isCorrect = exercise.userAnswer.toUpperCase() === correctAnswer;

    setExercises(prev => prev.map(ex => 
      ex.id === exerciseId 
        ? { ...ex, isCorrect, showAnswer: true }
        : ex
    ));
  };

  const updateExerciseAnswer = (exerciseId: number, answer: string) => {
    setExercises(prev => prev.map(ex => 
      ex.id === exerciseId 
        ? { ...ex, userAnswer: answer, isCorrect: null, showAnswer: false }
        : ex
    ));
  };

  const resetExercises = () => {
    setExercises(prev => prev.map(ex => ({
      ...ex,
      userAnswer: '',
      isCorrect: null,
      showAnswer: false
    })));
  };

  const getExerciseTitle = (type: string) => {
    switch (type) {
      case 'binary': return 'to Binary';
      case 'octal': return 'to Octal';
      case 'hexadecimal': return 'to Hexadecimal';
      default: return '';
    }
  };

  const getCorrectAnswer = (decimal: string, type: string) => {
    const num = parseInt(decimal);
    switch (type) {
      case 'binary':
        return num.toString(2).padStart(8, '0');
      case 'octal':
        return num.toString(8).padStart(3, '0');
      case 'hexadecimal':
        return num.toString(16).toUpperCase().padStart(2, '0');
      default:
        return '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <Server className="h-6 w-6 text-purple-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">
          More about IP Addresses - Year 9 Guide
        </h2>
      </div>

      {/* Introduction */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">What is an IP Address?</h3>
        <p className="text-blue-800 mb-3">
          An IP (Internet Protocol) address is like a postal address for devices on the internet. 
          Just like your home has a unique address so mail can find you, every device connected 
          to the internet has a unique IP address so data can find it.
        </p>
        <div className="bg-blue-100 p-3 rounded border border-blue-200">
          <p className="text-blue-900 text-sm">
            <strong>Think of it this way:</strong> If the internet is like a massive city, 
            IP addresses are the street addresses that help data packets find their way to the right "house" (device).
          </p>
        </div>
      </div>

      {/* IPv4 Structure */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">IPv4 Address Structure</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">The Dotted Decimal Format</h4>
            <div className="bg-white p-3 rounded border border-gray-200 mb-3">
              <div className="font-mono text-lg text-center text-purple-700">192.168.1.1</div>
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Four numbers separated by dots</li>
              <li>• Each number is called an "octet"</li>
              <li>• Each octet ranges from 0 to 255</li>
              <li>• Total of 32 bits (8 bits per octet)</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Why 0-255?</h4>
            <p className="text-sm text-gray-700 mb-2">
              Each octet is 8 bits, and with 8 bits you can represent:
            </p>
            <div className="bg-white p-2 rounded border border-gray-200 text-center">
              <div className="text-sm text-gray-600">2⁸ = 256 different values</div>
              <div className="text-sm text-gray-600">(0, 1, 2, 3, ... 254, 255)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Learn Different Notations */}
      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3">
          🤔 Why Do We Need Different IP Address Formats?
        </h3>
        <div className="space-y-3 text-yellow-800">
          <div className="flex items-start">
            <Globe className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Browser Compatibility:</strong> Some browsers and systems can understand IP addresses 
              in different formats. For example, you can type "2130706433" in your browser instead of "127.0.0.1"!
            </div>
          </div>
          <div className="flex items-start">
            <Calculator className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Computer Processing:</strong> Computers actually work with binary (1s and 0s), 
              so understanding binary helps you see how computers "think\" about IP addresses.
            </div>
          </div>
          <div className="flex items-start">
            <Eye className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Network Troubleshooting:</strong> Network engineers sometimes use hexadecimal 
              or octal notation for easier calculation and debugging.
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Understanding Technology:</strong> Learning these conversions helps you understand 
              how digital systems work at a fundamental level.
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Converter */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Interactive IP Address Converter</h3>
        
        {/* Example Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose an IP address to convert:
          </label>
          <div className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example.decimal}
                onClick={() => setSelectedExample(example.decimal)}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  selectedExample === example.decimal
                    ? 'bg-purple-100 border-purple-300 text-purple-800'
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {example.decimal}
              </button>
            ))}
          </div>
        </div>

        {/* Conversion Results */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Decimal (Base 10)</h4>
            <div className="font-mono text-sm bg-white p-2 rounded border">
              {getCurrentExample().decimal}
            </div>
            <p className="text-xs text-blue-700 mt-1">What we normally see</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">Binary (Base 2)</h4>
            <div className="font-mono text-xs bg-white p-2 rounded border break-all">
              {getCurrentExample().binary}
            </div>
            <p className="text-xs text-green-700 mt-1">How computers see it</p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-900 mb-2">Octal (Base 8)</h4>
            <div className="font-mono text-sm bg-white p-2 rounded border">
              {getCurrentExample().octal}
            </div>
            <p className="text-xs text-orange-700 mt-1">Uses digits 0-7</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-2">Hexadecimal (Base 16)</h4>
            <div className="font-mono text-sm bg-white p-2 rounded border">
              {getCurrentExample().hexadecimal}
            </div>
            <p className="text-xs text-purple-700 mt-1">Uses 0-9, A-F</p>
          </div>
        </div>

        {/* Show Calculation Button */}
        <div className="text-center mb-4">
          <button
            onClick={() => setShowCalculation(!showCalculation)}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Calculator className="h-4 w-4 mr-2" />
            {showCalculation ? 'Hide' : 'Show'} Step-by-Step Calculations
          </button>
        </div>
      </div>

      {/* Step-by-Step Calculations */}
      {showCalculation && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Step-by-Step Conversion for {selectedExample}
          </h3>
          
          {getStepByStepConversion(selectedExample).map((octet, index) => (
            <div key={index} className="mb-6 bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">
                Octet {index + 1}: {octet.decimal}
              </h4>
              
              <div className="grid lg:grid-cols-3 gap-4">
                {/* Binary Conversion */}
                <div className="bg-green-50 p-3 rounded border border-green-200 mb-4 lg:mb-0">
                  <h5 className="font-semibold text-green-900 mb-2">To Binary (Base 2)</h5>
                  <div className="text-sm space-y-1">
                    <p className="text-green-800 mb-2">
                      <strong>Method:</strong> Divide by powers of 2 (128, 64, 32, 16, 8, 4, 2, 1)
                    </p>
                    {octet.binarySteps.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="text-xs text-green-700 font-mono">
                        {step}
                      </div>
                    ))}
                    <div className="mt-2 p-2 bg-white rounded border border-green-300">
                      <strong>Result: {octet.binary}</strong>
                    </div>
                  </div>
                </div>

                {/* Octal Conversion */}
                <div className="bg-orange-50 p-3 rounded border border-orange-200 mb-4 lg:mb-0">
                  <h5 className="font-semibold text-orange-900 mb-2">To Octal (Base 8)</h5>
                  <div className="text-sm space-y-1">
                    <p className="text-orange-800 mb-2">
                      <strong>Method:</strong> Repeatedly divide by 8, read remainders upward
                    </p>
                    {octet.octalSteps.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="text-xs text-orange-700 font-mono">
                        {step}
                      </div>
                    ))}
                    <div className="mt-2 p-2 bg-white rounded border border-orange-300">
                      <strong>Result: {octet.octal}</strong>
                    </div>
                  </div>
                </div>

                {/* Hexadecimal Conversion */}
                <div className="bg-purple-50 p-3 rounded border border-purple-200">
                  <h5 className="font-semibold text-purple-900 mb-2">To Hexadecimal (Base 16)</h5>
                  <div className="text-sm space-y-1">
                    <p className="text-purple-800 mb-2">
                      <strong>Method:</strong> Repeatedly divide by 16, read remainders upward
                    </p>
                    {octet.hexSteps.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="text-xs text-purple-700 font-mono">
                        {step}
                      </div>
                    ))}
                    <div className="mt-2 p-2 bg-white rounded border border-purple-300">
                      <strong>Result: {octet.hexadecimal}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calculator */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 Basic Calculator</h3>
        <div className="bg-gray-100 p-4 rounded-lg max-w-xs mx-auto">
          {/* Display */}
          <div className="bg-black text-white p-3 rounded mb-3 text-right font-mono text-xl">
            {calculatorDisplay}
          </div>
          
          {/* Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {/* Row 1 */}
            <button
              onClick={clearCalculator}
              className="bg-red-500 hover:bg-red-600 text-white p-3 rounded font-semibold"
            >
              C
            </button>
            <button
              onClick={clearEntry}
              className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded font-semibold"
            >
              CE
            </button>
            <button
              onClick={() => inputOperation('/')}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded font-semibold"
            >
              ÷
            </button>
            <button
              onClick={() => inputOperation('*')}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded font-semibold"
            >
              ×
            </button>

            {/* Row 2 */}
            <button
              onClick={() => inputDigit('7')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 p-3 rounded font-semibold"
            >
              7
            </button>
            <button
              onClick={() => inputDigit('8')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 p-3 rounded font-semibold"
            >
              8
            </button>
            <button
              onClick={() => inputDigit('9')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 p-3 rounded font-semibold"
            >
              9
            </button>
            <button
              onClick={() => inputOperation('-')}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded font-semibold"
            >
              −
            </button>

            {/* Row 3 */}
            <button
              onClick={() => inputDigit('4')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 p-3 rounded font-semibold"
            >
              4
            </button>
            <button
              onClick={() => inputDigit('5')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 p-3 rounded font-semibold"
            >
              5
            </button>
            <button
              onClick={() => inputDigit('6')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 p-3 rounded font-semibold"
            >
              6
            </button>
            <button
              onClick={() => inputOperation('+')}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded font-semibold"
            >
              +
            </button>

            {/* Row 4 */}
            <button
              onClick={() => inputDigit('1')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 p-3 rounded font-semibold"
            >
              1
            </button>
            <button
              onClick={() => inputDigit('2')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 p-3 rounded font-semibold"
            >
              2
            </button>
            <button
              onClick={() => inputDigit('3')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 p-3 rounded font-semibold"
            >
              3
            </button>
            <button
              onClick={performCalculation}
              className="bg-green-500 hover:bg-green-600 text-white p-3 rounded font-semibold row-span-2"
            >
              =
            </button>

            {/* Row 5 */}
            <button
              onClick={() => inputDigit('0')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 p-3 rounded font-semibold col-span-2"
            >
              0
            </button>
            <button
              onClick={() => inputDigit('.')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 p-3 rounded font-semibold"
            >
              .
            </button>
          </div>
        </div>
        <p className="text-center text-sm text-gray-600 mt-2">
          Use this calculator to help with your conversion exercises below!
        </p>
      </div>

      {/* Practice Exercises */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Practice Exercises</h3>
        <p className="text-gray-700 mb-4">
          Practice converting decimal numbers to different number systems. Use the calculator above to help with your calculations!
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {exercises.map((exercise) => (
            <div key={exercise.id} className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-semibold text-gray-900 mb-2">
                Exercise {exercise.id}: Convert {exercise.decimal} {getExerciseTitle(exercise.type)}
              </h4>
              
              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">
                  Your answer:
                </label>
                <input
                  type="text"
                  value={exercise.userAnswer}
                  onChange={(e) => updateExerciseAnswer(exercise.id, e.target.value)}
                  placeholder={`Enter ${exercise.type} result...`}
                  className="w-full p-2 border border-gray-300 rounded text-sm font-mono"
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => checkAnswer(exercise.id)}
                  disabled={!exercise.userAnswer.trim()}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Check
                </button>
              </div>
              
              {exercise.showAnswer && (
                <div className={`mt-3 p-2 rounded text-sm ${
                  exercise.isCorrect 
                    ? 'bg-green-100 text-green-800 border border-green-300' 
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}>
                  {exercise.isCorrect ? (
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Correct! Well done!
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center mb-1">
                        <X className="h-4 w-4 mr-1" />
                        Not quite right.
                      </div>
                      <div>
                        <strong>Correct answer:</strong> {getCorrectAnswer(exercise.decimal, exercise.type)}
                      </div>
                      <div className="text-xs mt-1">
                        Try using the step-by-step method shown above!
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <button
            onClick={resetExercises}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Reset All Exercises
          </button>
        </div>
        
        {/* Exercise Tips */}
        <div className="bg-blue-50 p-4 rounded-lg mt-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Exercise Tips</h4>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• <strong>Binary:</strong> Use repeated division by 2, write remainders from bottom to top</li>
            <li>• <strong>Octal:</strong> Use repeated division by 8, write remainders from bottom to top</li>
            <li>• <strong>Hexadecimal:</strong> Use repeated division by 16, remember A=10, B=11, C=12, D=13, E=14, F=15</li>
            <li>• <strong>Padding:</strong> Binary should be 8 digits, Octal 3 digits, Hexadecimal 2 digits</li>
            <li>• Use the calculator above to help with division and remainder calculations!</li>
          </ul>
        </div>
      </div>

      {/* Practical Applications */}
      <div className="bg-indigo-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-indigo-900 mb-3">🚀 Try This at Home!</h3>
        <div className="space-y-3 text-indigo-800">
          <div>
            <strong>Browser Experiment:</strong> Try typing these in your browser's address bar:
            <ul className="mt-2 ml-4 space-y-1 text-sm">
              <li>• <code className="bg-white px-1 rounded">127.0.0.1</code> (decimal)</li>
              <li>• <code className="bg-white px-1 rounded">2130706433</code> (decimal as single number)</li>
              <li>• <code className="bg-white px-1 rounded">0x7f000001</code> (hexadecimal)</li>
              <li>• <code className="bg-white px-1 rounded">017700000001</code> (octal)</li>
            </ul>
            <p className="text-sm mt-2">They all point to the same place - your own computer!</p>
          </div>
        </div>
      </div>

      {/* Number Systems Reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">Number System Quick Reference</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Binary (Base 2):</span>
              <span className="font-mono">0, 1</span>
            </div>
            <div className="flex justify-between">
              <span>Octal (Base 8):</span>
              <span className="font-mono">0, 1, 2, 3, 4, 5, 6, 7</span>
            </div>
            <div className="flex justify-between">
              <span>Decimal (Base 10):</span>
              <span className="font-mono">0, 1, 2, 3, 4, 5, 6, 7, 8, 9</span>
            </div>
            <div className="flex justify-between">
              <span>Hexadecimal (Base 16):</span>
              <span className="font-mono">0-9, A, B, C, D, E, F</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">Powers of 2 (for Binary)</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="space-y-1">
              <div>2⁰ = 1</div>
              <div>2¹ = 2</div>
              <div>2² = 4</div>
              <div>2³ = 8</div>
            </div>
            <div className="space-y-1">
              <div>2⁴ = 16</div>
              <div>2⁵ = 32</div>
              <div>2⁶ = 64</div>
              <div>2⁷ = 128</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-green-50 p-4 rounded-lg">
        <h4 className="font-semibold text-green-900 mb-2">🎯 Key Takeaways</h4>
        <ul className="text-green-800 space-y-1 text-sm">
          <li>• IP addresses are unique identifiers for devices on the internet</li>
          <li>• The same IP address can be written in different number systems</li>
          <li>• Computers work with binary, but humans prefer decimal</li>
          <li>• Understanding these conversions helps you understand how computers work</li>
          <li>• Different formats can be useful for different purposes in networking</li>
        </ul>
      </div>
    </div>
  );
};