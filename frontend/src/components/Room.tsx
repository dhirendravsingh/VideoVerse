import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"

export default function Room(){

    const [searchParams, setSearchParams] = useSearchParams()
    const name = searchParams.get('name')

    useEffect(()=>{
        //logic to init user to the room
    }, [name])

    return <div>
        
    </div>
}