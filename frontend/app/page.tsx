import { NavBar } from "./(navBar)/navBar";
import { Dashboard } from "./(dashboard)/dashboard"

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <NavBar />
      <Dashboard />      
    </div>
    
  );
}