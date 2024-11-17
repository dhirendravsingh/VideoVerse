import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Socket, io } from "socket.io-client"
import { useRef } from "react"

const URL = "http://localhost:3000"
export default function Room({
    name,
    localAudioTrack,
    localVideoTrack
}:{
    name : string,
    localAudioTrack : MediaStreamTrack | null,
    localVideoTrack : MediaStreamTrack | null
}){

    const [searchParams, setSearchParams] = useSearchParams()
    // const name = searchParams.get('name')
    const [lobby, setLobby] = useState(true)
    const [socket, setSocket] = useState<null | Socket>(null)
    const [sendingPc, setSendingPc] = useState<null | RTCPeerConnection>(null)
    const [receivingPc, setReceivingPc] = useState<null | RTCPeerConnection>(null)
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null)
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null)
    const [remoteMediaStream , setRemoteMediaStream] = useState<MediaStream | null>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>()
    const localVideoRef = useRef<HTMLVideoElement>()



    useEffect(()=>{
        //logic to init user to the room
        const socket = io(URL)
        socket.on("send-offer", async ({roomId})=>{
            setLobby(false)
            const pc = new RTCPeerConnection()
            setSendingPc(pc)
            if(localVideoTrack){
                pc.addTrack(localVideoTrack)

            }
            if(localAudioTrack){
                pc.addTrack(localAudioTrack)

            }
            // pc.addTrack(localAudioTrack)

            pc.onicecandidate = async ()=>{
                const sdp = await pc.createOffer()
                socket.emit("offer", {
                    sdp : "",
                    roomId
                })
            }

            
        })
        socket.on("offer", async ({roomId, offer})=>{
            setLobby(false)
            const pc = new RTCPeerConnection()
            pc.setRemoteDescription({sdp: offer, type: "offer"})
            const sdp = await pc.createAnswer()
            const stream = new MediaStream()
            if(remoteVideoRef.current){
                remoteVideoRef.current.srcObject = stream

            }
            setRemoteMediaStream(stream)
            setReceivingPc(pc)
            pc.ontrack=(({track, type})=>{
                if(type === 'audio'){
                    // setRemoteAudioTrack(track)
                   // @ts-ignore
                    remoteVideoRef.current.srcObject.addTrack(track)
                } else{
                    // setRemoteVideoTrack(track)
                    // @ts-ignore

                    remoteVideoRef.current.srcObject.addTrack(track)

                }
                //@ts-ignore
                remoteVideoRef.current.play()
            })

            socket.emit("answer" , {
                roomId,
                sdp : ""
            })
        })

    

        socket.on("answer", ({roomId, answer})=>{
            setLobby(false)

            alert("connection done")
        })

        socket.on("lobby", ()=>{
            setLobby(true)
        })

        setSocket(socket)

    }, [name])

  useEffect(()=>{
    if(localVideoRef.current){
            // @ts-ignore
            localVideoRef.current.srcObject = new MediaStream([localVideoTrack, localAudioTrack])
            localVideoRef.current.play()
        
        }
        
  }, [localVideoRef])

    return <div>
            Hi {name}
            <video autoPlay width={400} height={400} ref={localVideoRef}/>
            <video autoPlay width={400} height={400} ref={remoteVideoRef}/>
    </div>
}