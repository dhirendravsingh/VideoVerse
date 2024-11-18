import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Socket, io } from "socket.io-client"
import { useRef } from "react"

const URL = "http://localhost:3000/"
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
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
    const localVideoRef = useRef<HTMLVideoElement | null>(null)



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
                        type : "sender",
                        roomId
                    })
                }
            }
            pc.onnegotiationneeded = async ()=>{
                const sdp = await pc.createOffer()
                
                pc.setLocalDescription(sdp)
                socket.emit("offer", {
                    sdp : sdp,
                    roomId
                })
            }

            
        })
        socket.on("offer", async ({roomId, sdp : remoteSdp})=>{
            setLobby(false)
            const pc = new RTCPeerConnection()
            pc.setRemoteDescription(remoteSdp)
            const sdp = await pc.createAnswer()
            
            await pc.setLocalDescription(sdp)
            const stream = new MediaStream()
            if(remoteVideoRef.current){
                remoteVideoRef.current.srcObject = stream

            }
            setRemoteMediaStream(stream)
            setReceivingPc(pc)

            pc.onicecandidate = async (e)=>{
                if(!e.candidate){
                    return
                }
                if(e.candidate){
                    socket.emit("add-ice-candidate", {
                        candidate : e.candidate,
                        type : "receiver",
                        roomId
                        
                    })
                }
            }
            setRemoteMediaStream(stream)
            setReceivingPc(pc)
            window.pcr = pc
            pc.ontrack=(e)=>{
               
            }

            socket.emit("answer" , {
                roomId,
                sdp : sdp
            })
            setTimeout(()=>{
               const track1 =  pc.getTransceivers()[0].receiver.track
               const track2 =  pc.getTransceivers()[1].receiver.track

              if(track1.kind === "video"){
                setRemoteAudioTrack(track2)
                setRemoteVideoTrack(track1)
              } else{
                setRemoteAudioTrack(track1)
                setRemoteVideoTrack(track2)
              }
              //@ts-ignore
              remoteVideoRef.current?.srcObject.addTrack(track1)
            //@ts-ignore

              remoteVideoRef.current?.srcObject.addTrack(track2)
            //@ts-ignore

              remoteVideoRef.current.play()
            }, 5000)
        })

    

        socket.on("answer", ({roomId, sdp : remoteSdp})=>{
            setLobby(false)
            setSendingPc(pc => {
                pc?.setRemoteDescription(
                    remoteSdp
                )
                
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
                setSendingPc(pc => {
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