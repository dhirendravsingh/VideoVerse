import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import Room from "./Room";
export default function Landing(){
    const [name, setName] = useState("");
    const [joined, setJoined] = useState(false)
    const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null)
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null)

    const videoRef = useRef<HTMLVideoElement>(null)

    const getCam = async ()=>{
        const stream = await window.navigator.mediaDevices.getUserMedia({
            video :true,
            audio : true
        })
        const videoTrack = stream.getVideoTracks()[0]
        const audioTrack = stream.getAudioTracks()[0]
        setLocalAudioTrack(audioTrack)
        setLocalVideoTrack(videoTrack)
        if(!videoRef.current){
            return
        }
        videoRef.current.srcObject = new MediaStream([videoTrack, audioTrack])

    }

    useEffect(()=>{
        if(videoRef && videoRef.current){
            getCam()
        }
    },[videoRef])

    if(!joined){
        return <div>
        <video autoPlay ref={videoRef}></video>
        <input type="text" onChange={(e)=>{setName(e.target.value)}}></input>
        <button onClick={()=>{
            setJoined(true)
        }}>Connect</button>
    </div>
    }

    return <Room name={name} localAudioTrack={localAudioTrack} localVideoTrack={localVideoTrack}/>

}