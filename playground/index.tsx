import '../src/main.css'
import ReactDOM from 'react-dom'
import { TileLayoutRoot } from '../src/Layout'

function Playground() {
  return (
    <div className={'relative'}>
      <TileLayoutRoot/>
    </div>
  )
}

// mount the Playground component
ReactDOM.render(
  <Playground/>,
  document.getElementById('app'))