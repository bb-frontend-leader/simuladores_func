import { useEffect, useRef, useState } from 'react'


export default function useResize(ref) {
    const [press, setPress] = useState(false)
    const [styles, setStyles] = useState({ position: 'relative', width: '300px', left: 0 })

    const resizeOptions = useRef({})

    const isValidElement = (element) => {


        // if (typeof element === 'object' && Object.prototype.hasOwnProperty.call(element, 'current')) {
        //     return element.current !== null
        // }

        return typeof element !== 'undefined'
    }

    useEffect(() => {
        if (!ref.current) return;

        const onPointerMove = ({ clientX }) => {
            if (!press) return;
            console.log('onPointerMove', press)

            setStyles((prevStyles) => {
                let newWidth;
                let newleft;

                const diferenciaX = clientX - resizeOptions.current.start
                const GAP = 1.07

                if (resizeOptions.current.side === "right") {
                    newWidth = `${(resizeOptions.current.width + diferenciaX) * GAP}px`;
                }

                if (resizeOptions.current.side === "left") {
                    newWidth = `${(resizeOptions.current.width - diferenciaX) * GAP}px`;
                    newleft = `${resizeOptions.current.left + diferenciaX}px`;
                }
                console.log("🚀 ~ file: useResize.js:42 ~ setStyles ~ resizeOptions.current.width :", resizeOptions.current.width)

                return {
                    ...prevStyles,
                    width: newWidth,
                    left: newleft || `${resizeOptions.current.left}px`
                }
            })
        }

        const onPointerDown = (event) => {

            if (!event.srcElement.dataset?.side) return;
            console.log('onPointerDown', press)

            resizeOptions.current = {
                width: parseInt(styles.width),
                left: parseInt(styles.left),
                side: event.srcElement.dataset.side,
                start: event.clientX,
            }

            setPress(true)
        }

        const onPointerUp = () => {
            if (press) {
                console.log('onPointerUp', press)
                setPress(!press)
            }
        }


        // Agregar escuchadores de eventos
        ref.current.addEventListener('mousedown', onPointerDown)
        ref.current.addEventListener('mousemove', onPointerMove)
        document.addEventListener('mouseup', onPointerUp)

        return () => {
            document.removeEventListener('mouseup', onPointerUp)
            ref.current.removeEventListener('mousedown', onPointerDown)
            ref.current.removeEventListener('mousemove', onPointerMove)
        }

    }, [ref, press])

    return {
        styles
    }
}