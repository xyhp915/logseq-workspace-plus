import '../src/main.css'
import './index.css'
import ReactDOM from 'react-dom'
import { getCardViewCtorFromRegistry, TileLayoutRoot } from '../src/Layout'

function Playground() {
  return (
    <div className={'relative'}>
      <TileLayoutRoot
        viewPlaceholder={() => {
          return <div className={'flex items-center justify-center w-full h-full text-2xl text-gray-400'}>No card
            selected</div>
        }}
        requireCardView={async (tile) => {
          const cardID = ['HiCard', 'YoutubeCard'][Math.floor(Math.random() * 2)]
          const CardViewCtor = getCardViewCtorFromRegistry(cardID)
          if (!CardViewCtor) {
            throw new Error(`${cardID} not registered!`)
          }

          return new CardViewCtor(tile)
        }}/>
    </div>
  )
}

// mount the Playground component
ReactDOM.render(
  <Playground/>,
  document.getElementById('app'))