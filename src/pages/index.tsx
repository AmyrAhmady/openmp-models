import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import ColorPicker from 'src/components/ColorPicker';
import Header from 'src/components/Header'
import MenuDesktop from 'src/components/Menu/Desktop';
import MenuMobile from 'src/components/Menu/Mobile';
import ModelViewer from 'src/components/ModelViewer';
import { ModelData } from 'src/components/ModelViewer/types';
import SideBar from 'src/components/SideBar'
import ModelInfo from 'src/container/ModelInfo';
import realNames from 'src/resources/realNames';
import { themeSelect } from 'src/resources/theme';
import store from 'src/state/store';

interface Props {
    isMobileView: boolean;
}

export default class Main extends React.Component<Props, any> {

    constructor(props: Props) {
        super(props);

        this.state = {
            isMobileView: props.isMobileView,
            modelType: 'vehicle',
            info: {
                "id": 400,
                "name": "Landstalker",
                "cat": "Off Road",
                "mods": "Transfender",
                "model": "landstal"
            },
            models: [] as ModelData[]
        }

        this.updateSize = this.updateSize.bind(this);
    }

    async loadModel(name: string, type: string) {
        let models: ModelData[] = [];
        this.setState({ models: [] });
        await fetch(`https://assets.open.mp/assets/models/exports/${name}.json`)
            .then((r) => r.json())
            .then(data => {
                console.log("hi")
                let texArr: any[] = [];
                data.forEach((frame: any) => {

                    if (frame.geometry && frame.geometry.textures) {
                        frame.geometry.textures.forEach((texture: any) => {

                            let tempArr = texArr.filter((item: any) => item.name === texture.name);

                            if (!tempArr.length) {
                                if (texture.name) {
                                    let obj = {
                                        name: texture.name,
                                        url: "https://assets.open.mp/assets/models/exports/" + texture.name.toLowerCase() + ".png"
                                    };
                                    console.log("adding a texture to list", texture.name)
                                    texArr.push(obj);
                                }
                            }

                        });
                    }

                });

                let modelData = {
                    type: type,
                    name: name.toLowerCase(),
                    obj: data,
                    textures: texArr,
                    color: {
                        primary: Math.floor(Math.random() * 255),
                        secondary: Math.floor(Math.random() * 255),
                    },
                    modifications: [1077, 1008]
                };

                models.push(modelData);
            })
            .catch(error => {
                console.log(error);
            });

        this.setState({ models: models, isReady: true })
    }

    componentDidMount() {
        window.addEventListener('resize', this.updateSize);
        this.updateSize();

        store.events.subscribe('stateChange', prevState => {
            console.log("prevState", prevState, "newState", store.state);
            if (prevState.themeMode === store.state.themeMode) {
                this.forceUpdate();
            }
        });

        this.loadModel(this.state.info.model, 'vehicle');
    }

    static async getInitialProps({ req }) {
        let isMobileView = (req
            ? req.headers['user-agent']
            : '').match(
                /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i
            );

        return { isMobileView: Boolean(isMobileView) }
    }

    updateSize() {
        if (window.innerWidth < 1200) {
            if (!this.state.isMobileView)
                this.setState({ isMobileView: true });
        }
        else {
            if (this.state.isMobileView)
                this.setState({ isMobileView: false });
        }
    }

    render() {

        const theme = themeSelect();

        const {
            modelType,
            info,
            isMobileView
        } = this.state;

        return (
            <View style={[styles.container, { backgroundColor: theme.mainBg }]}>
                <Header
                    isMobile={isMobileView}
                    modelType={modelType}
                    onThemeModeChange={(mode) => {
                        store.dispatch('setThemeMode', mode);
                    }}
                    onModelTypeChange={(type) => {
                        this.setState({ modelType: type.value });
                    }}
                />
                <View style={{ flexDirection: isMobileView ? 'column' : 'row', flex: 1, width: '100%' }}>
                    <SideBar isMobile={isMobileView} style={{ width: '20%' }}>
                        {isMobileView ? (
                            <MenuMobile
                                {...this.props}
                                modelType={modelType}
                                onSelectItem={(model) => {
                                    this.setState({ info: model }, () => {
                                        const {
                                            info
                                        } = this.state;
                                        this.loadModel(info.model || info.name, modelType);
                                    });
                                }}
                            />
                        ) : (
                            <MenuDesktop
                                {...this.props}
                                modelType={modelType}
                                onSelectItem={(model) => {
                                    this.setState({ info: model }, () => {
                                        const {
                                            info
                                        } = this.state;
                                        this.loadModel(info.model || info.name, modelType);
                                    });
                                }}
                            />
                        )}

                    </SideBar>
                    <View style={{ flex: 1, height: '100%' }}>
                        {this.state.models.length ? (
                            <ModelViewer
                                models={this.state.models === undefined ? [] : this.state.models}
                                autoSpin={false}
                            />
                        ) : null}
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
                            <ModelInfo
                                title="Model info"
                                style={{ marginHorizontal: 20, marginTop: 15 }}
                                data={Object.entries(info).map((item) => {
                                    const itemName = realNames[item[0]];
                                    return {
                                        label: itemName ? itemName : "Unknown info",
                                        value: item[1].toString()
                                    }
                                })}
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
