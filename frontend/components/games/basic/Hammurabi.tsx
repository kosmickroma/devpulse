'use client'

import { useState, useEffect, useRef } from 'react'
import { submitScore } from '@/lib/arcade'

type GameState = 'intro' | 'yearStart' | 'buying' | 'feeding' | 'planting' | 'yearEnd' | 'impeached' | 'completed'

interface CityState {
  year: number
  population: number
  acres: number
  bushels: number
  harvestYield: number
  peopleStarved: number
  newPeople: number
  totalDeaths: number
  grainPrice: number
  plagueYear: boolean
  ratEaten: number
}

export default function Hammurabi() {
  const [gameState, setGameState] = useState<GameState>('intro')
  const [currentInput, setCurrentInput] = useState<string>('')
  const [output, setOutput] = useState<string[]>([])
  const terminalRef = useRef<HTMLDivElement>(null)

  // City state
  const [city, setCity] = useState<CityState>({
    year: 1,
    population: 95,
    acres: 1000,
    bushels: 2800,
    harvestYield: 3,
    peopleStarved: 0,
    newPeople: 5,
    totalDeaths: 0,
    grainPrice: 20,
    plagueYear: false,
    ratEaten: 200
  })

  // Temporary variables for turn
  const [acresToBuy, setAcresToBuy] = useState(0)
  const [acrestoSell, setAcresToSell] = useState(0)
  const [bushelsToFeed, setBushelsToFeed] = useState(0)
  const [acresToPlant, setAcresToPlant] = useState(0)

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [output])

  // Initialize game
  useEffect(() => {
    addOutput('HAMURABI')
    addOutput('CREATIVE COMPUTING  MORRISTOWN, NEW JERSEY')
    addOutput('')
    addOutput('')
    addOutput('TRY YOUR HAND AT GOVERNING ANCIENT BABYLON FOR A')
    addOutput('TEN-YEAR TERM OF OFFICE.')
    addOutput('')
    addOutput('CONGRATULATIONS, YOU ARE THE NEWEST RULER OF ANCIENT')
    addOutput('SUMERIA, ELECTED FOR A TEN YEAR TERM OF OFFICE.')
    addOutput('YOUR DUTIES ARE TO DISPENSE FOOD, DIRECT FARMING,')
    addOutput('AND TO BUY AND SELL LAND AS NEEDED TO SUPPORT YOUR')
    addOutput('PEOPLE.  WATCH OUT FOR RAT INFESTATIONS AND THE PLAGUE!')
    addOutput('GRAIN IS THE GENERAL CURRENCY, MEASURED IN BUSHELS.')
    addOutput('THE FOLLOWING WILL HELP YOU IN YOUR DECISIONS:')
    addOutput('')
    addOutput('  * EACH PERSON NEEDS AT LEAST 20 BUSHELS PER YEAR TO SURVIVE')
    addOutput('  * EACH PERSON CAN FARM AT MOST 10 ACRES')
    addOutput('  * IT TAKES 2 BUSHELS OF GRAIN TO FARM AN ACRE')
    addOutput('  * THE MARKET PRICE FOR LAND FLUCTUATES YEARLY')
    addOutput('  * RULE WISELY AND KEEP YOUR PEOPLE FED!')
    addOutput('')
    addOutput('')
    startYear()
  }, [])

  // Submit score on game end
  useEffect(() => {
    if (gameState === 'completed') {
      const finalScore = calculateFinalScore()

      submitScore({
        gameId: 'hammurabi',
        score: finalScore,
        metadata: {
          yearsCompleted: city.year - 1,
          finalPopulation: city.population,
          finalAcres: city.acres,
          totalDeaths: city.totalDeaths,
          acresPerPerson: Math.floor(city.acres / city.population)
        }
      }).catch(err => console.error('Failed to submit score:', err))
    }
  }, [gameState])

  const addOutput = (text: string) => {
    setOutput(prev => [...prev, text])
  }

  const startYear = () => {
    // Generate random events
    const newGrainPrice = Math.floor(Math.random() * 7) + 17  // 17-23 bushels per acre
    const plagueChance = Math.random()

    setCity(prev => ({
      ...prev,
      grainPrice: newGrainPrice,
      plagueYear: plagueChance < 0.15  // 15% chance of plague
    }))

    setGameState('yearStart')
    displayYearStart()
  }

  const displayYearStart = () => {
    addOutput('')
    addOutput(`HAMURABI:  I BEG TO REPORT TO YOU,`)
    addOutput(`IN YEAR ${city.year}, ${city.peopleStarved} PEOPLE STARVED, ${city.newPeople} CAME TO THE CITY.`)

    if (city.plagueYear) {
      addOutput('A HORRIBLE PLAGUE STRUCK! HALF THE PEOPLE DIED.')
      setCity(prev => ({ ...prev, population: Math.floor(prev.population / 2) }))
    }

    addOutput(`POPULATION IS NOW ${city.population}`)
    addOutput(`THE CITY NOW OWNS ${city.acres} ACRES.`)
    addOutput(`YOU HARVESTED ${city.harvestYield} BUSHELS PER ACRE.`)
    addOutput(`RATS ATE ${city.ratEaten} BUSHELS.`)
    addOutput(`YOU NOW HAVE ${city.bushels} BUSHELS IN STORE.`)
    addOutput('')
    addOutput(`LAND IS TRADING AT ${city.grainPrice} BUSHELS PER ACRE.`)
    addOutput('')

    setGameState('buying')
    addOutput('HOW MANY ACRES DO YOU WISH TO BUY?')
  }

  const handleInput = (value: string) => {
    const input = value.trim()
    const numValue = parseInt(input)

    addOutput(`> ${input}`)

    if (input === '' || isNaN(numValue)) {
      addOutput('HAMURABI: I CANNOT DO WHAT YOU WISH.')
      addOutput('GET YOURSELF ANOTHER STEWARD!!!!!')
      addOutput('')
      return
    }

    switch (gameState) {
      case 'buying':
        if (numValue < 0) {
          addOutput('HAMURABI: THINK AGAIN. YOU HAVE ONLY ' + city.acres + ' ACRES.')
          addOutput('')
          addOutput('HOW MANY ACRES DO YOU WISH TO BUY?')
          return
        }

        const cost = numValue * city.grainPrice
        if (cost > city.bushels) {
          addOutput('HAMURABI: THINK AGAIN. YOU HAVE ONLY')
          addOutput(city.bushels + ' BUSHELS OF GRAIN. NOW THEN,')
          addOutput('')
          addOutput('HOW MANY ACRES DO YOU WISH TO BUY?')
          return
        }

        setAcresToBuy(numValue)
        setCity(prev => ({
          ...prev,
          acres: prev.acres + numValue,
          bushels: prev.bushels - cost
        }))

        setGameState('feeding')
        addOutput('')
        addOutput('HOW MANY BUSHELS DO YOU WISH TO FEED YOUR PEOPLE?')
        break

      case 'feeding':
        if (numValue < 0 || numValue > city.bushels) {
          addOutput('HAMURABI: THINK AGAIN. YOU HAVE ONLY')
          addOutput(city.bushels + ' BUSHELS OF GRAIN. NOW THEN,')
          addOutput('')
          addOutput('HOW MANY BUSHELS DO YOU WISH TO FEED YOUR PEOPLE?')
          return
        }

        setBushelsToFeed(numValue)
        setCity(prev => ({ ...prev, bushels: prev.bushels - numValue }))

        setGameState('planting')
        addOutput('')
        addOutput('HOW MANY ACRES DO YOU WISH TO PLANT WITH SEED?')
        break

      case 'planting':
        if (numValue < 0 || numValue > city.acres) {
          addOutput('HAMURABI: THINK AGAIN. YOU OWN ONLY ' + city.acres + ' ACRES.')
          addOutput('')
          addOutput('HOW MANY ACRES DO YOU WISH TO PLANT WITH SEED?')
          return
        }

        // Check if enough people to farm
        if (numValue > city.population * 10) {
          addOutput('BUT YOU HAVE ONLY ' + city.population + ' PEOPLE TO TEND THE FIELDS!')
          addOutput('NOW THEN,')
          addOutput('')
          addOutput('HOW MANY ACRES DO YOU WISH TO PLANT WITH SEED?')
          return
        }

        // Check if enough grain for seed
        const seedNeeded = Math.floor(numValue / 2)
        if (seedNeeded > city.bushels) {
          addOutput('HAMURABI: THINK AGAIN. YOU HAVE ONLY')
          addOutput(city.bushels + ' BUSHELS OF GRAIN FOR SEED. NOW THEN,')
          addOutput('')
          addOutput('HOW MANY ACRES DO YOU WISH TO PLANT WITH SEED?')
          return
        }

        setAcresToPlant(numValue)
        setCity(prev => ({ ...prev, bushels: prev.bushels - seedNeeded }))

        // Calculate year end
        calculateYearEnd(numValue)
        break
    }
  }

  const calculateYearEnd = (planted: number) => {
    // Calculate harvest
    const yield_per_acre = Math.floor(Math.random() * 5) + 1  // 1-5 bushels per acre
    const harvested = planted * yield_per_acre

    // Calculate rat damage
    const ratChance = Math.random()
    let ratEaten = 0
    if (ratChance < 0.4) {
      ratEaten = Math.floor(city.bushels * (Math.random() * 0.3))  // Rats eat up to 30%
    }

    // Calculate new bushels
    const newBushels = city.bushels + harvested - ratEaten

    // Calculate starvation
    const fedPeople = Math.floor(bushelsToFeed / 20)
    const starved = Math.max(0, city.population - fedPeople)

    // Check for impeachment (>45% starved)
    if (starved > city.population * 0.45) {
      addOutput('')
      addOutput('YOU STARVED ' + starved + ' PEOPLE IN ONE YEAR!!!')
      addOutput('DUE TO THIS EXTREME MISMANAGEMENT YOU HAVE NOT ONLY')
      addOutput('BEEN IMPEACHED AND THROWN OUT OF OFFICE BUT YOU HAVE')
      addOutput('ALSO BEEN DECLARED NATIONAL FINK!!!!')
      addOutput('')
      addOutput('PRESS ESC TO EXIT')
      setGameState('impeached')
      return
    }

    // Calculate immigration
    const newPeople = Math.floor((20 * city.acres + newBushels) / (100 * city.population) + 1)

    // Update city state
    setCity(prev => ({
      ...prev,
      bushels: newBushels,
      harvestYield: yield_per_acre,
      peopleStarved: starved,
      newPeople: newPeople,
      totalDeaths: prev.totalDeaths + starved,
      ratEaten: ratEaten,
      population: prev.population - starved + newPeople,
      year: prev.year + 1
    }))

    // Check if 10 years complete
    if (city.year >= 10) {
      displayFinalReport()
      setGameState('completed')
    } else {
      // Continue to next year
      setTimeout(() => startYear(), 100)
    }
  }

  const displayFinalReport = () => {
    addOutput('')
    addOutput('')
    addOutput('IN YOUR 10-YEAR TERM OF OFFICE, ' + city.totalDeaths + ' PEOPLE STARVED PER YEAR ON THE')
    addOutput('AVERAGE, I.E., A TOTAL OF ' + (city.totalDeaths) + ' PEOPLE DIED!!')

    const acresPerPerson = city.acres / city.population

    addOutput('YOU STARTED WITH 10 ACRES PER PERSON AND ENDED WITH')
    addOutput(acresPerPerson.toFixed(2) + ' ACRES PER PERSON.')
    addOutput('')

    if (city.totalDeaths > 200 || acresPerPerson < 7) {
      addOutput('DUE TO THIS EXTREME MISMANAGEMENT YOU HAVE NOT ONLY')
      addOutput('BEEN IMPEACHED AND THROWN OUT OF OFFICE BUT YOU HAVE')
      addOutput('ALSO BEEN DECLARED NATIONAL FINK!!!!')
    } else if (city.totalDeaths > 100 || acresPerPerson < 9) {
      addOutput('YOUR HEAVY-HANDED PERFORMANCE SMACKS OF NERO AND IVAN IV.')
      addOutput('THE PEOPLE (REMAINING) FIND YOU AN UNPLEASANT RULER, AND,')
      addOutput('FRANKLY, HATE YOUR GUTS!!')
    } else if (city.totalDeaths > 33 || acresPerPerson < 10) {
      addOutput('YOUR PERFORMANCE COULD HAVE BEEN SOMEWHAT BETTER, BUT')
      addOutput('REALLY WASN&apos;T TOO BAD AT ALL. ' + Math.floor(Math.random() * 0.8 * city.population))
      addOutput('PEOPLE WOULD DEARLY LIKE TO SEE YOU ASSASSINATED BUT WE')
      addOutput('ALL HAVE OUR TRIVIAL PROBLEMS.')
    } else {
      addOutput('A FANTASTIC PERFORMANCE!!!  CHARLEMAGNE, DISRAELI, AND')
      addOutput('JEFFERSON COMBINED COULD NOT HAVE DONE BETTER!')
    }

    addOutput('')
    addOutput('PRESS ESC TO EXIT')
  }

  const calculateFinalScore = (): number => {
    // Score based on final population, acres per person, and low death rate
    const acresPerPerson = city.acres / city.population
    const deathRate = city.totalDeaths / 10  // Average deaths per year

    let score = city.population * 10  // Base score from population
    score += acresPerPerson * 50      // Bonus for land management
    score -= deathRate * 100           // Penalty for deaths

    return Math.max(0, Math.round(score))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentInput.trim()) {
      handleInput(currentInput)
      setCurrentInput('')
    } else if (e.key === 'Escape') {
      window.location.href = '/vault'
    }
  }

  return (
    <div className="w-full h-full bg-black p-6 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-2 border-b border-green-700">
        <h2 className="text-green-400 font-mono text-xl">HAMURABI</h2>
        <p className="text-green-600 text-sm font-mono">Original BASIC Program #39 (1968)</p>
        <p className="text-green-700 text-xs font-mono mt-1">
          Govern ancient Babylon and manage resources for 10 years
        </p>
      </div>

      {/* Terminal Output */}
      <div
        ref={terminalRef}
        className="flex-1 font-mono text-sm text-green-400 overflow-y-auto mb-4 whitespace-pre-wrap"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#22c55e #000000'
        }}
      >
        {output.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>

      {/* Input */}
      {(gameState === 'buying' || gameState === 'feeding' || gameState === 'planting') && (
        <div className="flex items-center gap-2 border-t border-green-700 pt-2">
          <span className="text-yellow-500 font-mono">&gt;</span>
          <input
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 bg-transparent text-green-400 font-mono outline-none caret-green-400"
            placeholder="ENTER NUMBER"
            autoFocus
          />
        </div>
      )}

      {/* Status Footer */}
      <div className="mt-2 text-xs text-green-700 text-center font-mono">
        {gameState !== 'intro' && `YEAR ${city.year}/10 | POP: ${city.population} | ACRES: ${city.acres} | GRAIN: ${city.bushels}`}
        {gameState === 'impeached' && ' | IMPEACHED ✗'}
        {gameState === 'completed' && ' | TERM COMPLETE ✓'}
        {' | ESC to exit'}
      </div>
    </div>
  )
}

/*
ORIGINAL BASIC CODE (HAMURABI.BAS - 1968):

(Simplified version - Original had complex GOTO statements)

Modernized changes:
- React state management instead of GOTO loops
- Separate game states (buying, feeding, planting)
- Improved input validation
- Better year-end calculations
- Maintained original game balance and rules
*/
