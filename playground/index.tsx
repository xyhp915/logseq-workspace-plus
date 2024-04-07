import '../src/main.css'
import './index.css'
import ReactDOM from 'react-dom'
import { getCardViewCtorFromRegistry, TileLayoutRoot } from '../src/Layout'

function Playground() {
  return (
    <div className={'relative'}>
      <TileLayoutRoot
        requireCardView={async (tile) => {
          const cardID = ['HiCard', 'YoutubeCard', 'ImageCard'][Math.floor(Math.random() * 3)]
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