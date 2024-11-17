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

            pc.onicecandidate = async (e)=>{
                if(e.candidate){
                    socket.emit("add-ice-candidate", {
                        candidate : e.candidate,
                        type : "sender"
                    })
                }
            }
            pc.onnegotiationneeded = async ()=>{
                const sdp = await pc.createOffer()
                
                pc.setLocalDescription(sdp)
                socket.emit("offer", {
                    sdp : "",
                    roomId
                })
            }

            
        })
        socket.on("offer", async ({roomId, sdp : remoteSdp})=>{
            setLobby(false)
            const pc = new RTCPeerConnection()
            pc.setRemoteDescription(remoteSdp)
            const sdp = await pc.createAnswer()
            
            pc.setLocalDescription(sdp)
            const stream = new MediaStream()
            if(remoteVideoRef.current){
                remoteVideoRef.current.srcObject = stream

            }
            setRemoteMediaStream(stream)
            setReceivingPc(pc)

            pc.onicecandidate = async (e)=>{
                if(e.candidate){
                    socket.emit("add-ice-candidate", {
                        candidate : e.candidate,
                        type : "receiver"
                    })
                }
            }

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
                sdp : sdp
            })
        })

    

        socket.on("answer", ({roomId, sdp : remoteSdp})=>{
            setLobby(false)
            setSendingPc(pc => {
                pc?.setRemoteDescription({
                    type: "answer",
                    sdp : remoteSdp
                })
                return pc
            })
            alert("connection done")
        })

        socket.on("lobby", ()=>{
            setLobby(true)
        })

        socket.on("add-ice-candidate", ({candidate, type})=>{
            if(type === "sender"){
                setReceivingPc(pc => {
                    pc?.addIceCandidate(candidate)
                    return pc
                })
            }
            else{
                setReceivingPc(pc => {
                    pc?.addIceCandidate(candidate)
                    return pc
            })
        }
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