import Link from "next/link";


export default async function Home() {

  return (
<>
<div className=" flex justify-center items-center mt-10 gap-5">

<Link href="/login" className="bg-black text-white p-3 rounded-2xl">Login</Link>
<Link href="/signup" className="bg-black text-white p-3 rounded-2xl">Sign up</Link>

</div>
</>
  )
}
