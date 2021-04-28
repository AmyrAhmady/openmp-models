
import { Dimensions, PixelRatio } from 'react-native';

export const widthPercentageToDP = widthPercent => {
    let screenWidth = Dimensions.get('window').width;
    const elemWidth = typeof widthPercent === "number" ? widthPercent : parseFloat(widthPercent);
    return PixelRatio.roundToNearestPixel(screenWidth * elemWidth / 100);
};

export const heightPercentageToDP = heightPercent => {
    let screenHeight = Dimensions.get('window').height;
    console.log(screenHeight);
    const elemHeight = typeof heightPercent === "number" ? heightPercent : parseFloat(heightPercent);
    return PixelRatio.roundToNearestPixel(screenHeight * elemHeight / 100);
};

export const listenOrientationChange = that => {
    let screenHeight = Dimensions.get('window').height;
    let screenWidth = Dimensions.get('window').width;
    Dimensions.addEventListener('change', newDimensions => {
        screenWidth = newDimensions.window.width;
        screenHeight = newDimensions.window.height;

        that.setState({
            orientation: screenWidth < screenHeight ? 'portrait' : 'landscape'
        });
    });
};

export const removeOrientationListener = () => {
    Dimensions.removeEventListener('change', () => { });
};
