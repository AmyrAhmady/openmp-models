import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import ColorPicker from 'src/components/ColorPicker';
import Header from 'src/components/Header'
import MenuDesktop from 'src/components/Menu/Desktop';
import MenuMobile from 'src/components/Menu/Mobile';
import RoundCard from 'src/components/RoundCard';
import SideBar from 'src/components/SideBar'

interface Props {
    isMobileView: boolean;
}

export default class Main extends React.Component<Props, any> {

    constructor(props: Props) {
        super(props);

        this.state = {
            modelType: 'vehicle',
            info: {
                "id": 400,
                "name": "Landstalker",
                "cat": "Off Road",
                "mods": "Transfender",
                "model": "landstal"
            }
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
                            <ColorPicker
                                title="Background color"
                                style={{ marginHorizontal: 20, marginTop: 15 }}
                                colors={[
                                    '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
                                    '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff',
                                    '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000',
                                    '#ffd8b1', '#000075', '#808080', '#ffffff', '#000000'
                                ]}
                                rows={2}
                            />
                        </SideBar>
                    )}
                </View>
            </View >
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        height: '100%'
    },
})
