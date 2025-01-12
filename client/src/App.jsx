import './App.css'
import { Outlet } from "react-router-dom"
import SignUp from './components/SignUp/SignUp'


function App() {

  return (
    <>
      <Outlet />
      <SignUp />
    </>
  )
}

export default App
