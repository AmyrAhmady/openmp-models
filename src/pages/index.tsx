import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Header from 'src/components/Header'
import MenuDesktop from 'src/components/Menu/Desktop';
import MenuMobile from 'src/components/Menu/Mobile';
import SideBar from 'src/components/SideBar'

interface Props {
    isMobileView: boolean;
}

export default class Main extends React.Component<Props, any> {

    constructor(props: Props) {
        super(props);

        this.state = {
            modelType: 'vehicle'
        }
    }

    static async getInitialProps({ req }) {
        let isMobileView = (req
            ? req.headers['user-agent']
            : '').match(
                /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i
            );

        return { isMobileView: Boolean(isMobileView) }
    }

    render() {

        const {
            modelType,
            info
        } = this.state;

        const {
            isMobileView
        } = this.props;
        return (
            <View style={styles.container}>
                <Header
                    modelType={modelType}
                    onModelTypeChange={(type) => {
                        this.setState({ modelType: type.value });
                    }}
                />
                <View style={{ flexDirection: isMobileView ? 'column' : 'row', flex: 1, width: '100%' }}>
                    <SideBar isMobile={isMobileView} style={{ width: '20%' }}>
                        {isMobileView ? (
                            <MenuMobile {...this.props} modelType={modelType} onSelectItem={(model) => this.setState({ info: JSON.stringify(model, null, 4) })} />
                        ) : (
                            <MenuDesktop {...this.props} modelType={modelType} onSelectItem={(model) => this.setState({ info: JSON.stringify(model, null, 4) })} />
                        )}

                    </SideBar>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 24 }}>{info}</Text>
                    </View>
                    {isMobileView ? null : (
                        <SideBar isMobile={isMobileView} style={{ width: '20%' }}>
                            <Text>Hey</Text>
                        </SideBar>
                    )}
                </View>
            </View >
        )
    }

}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        height: '100%'
    },
    link: {
        color: 'blue',
    },
    textContainer: {
        alignItems: 'center',
        marginTop: 16,
    },
    text: {
        alignItems: 'center',
        fontSize: 24,
        marginBottom: 24,
    },
})
