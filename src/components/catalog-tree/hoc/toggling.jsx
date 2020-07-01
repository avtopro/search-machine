import React from 'react';

export default function toggling(Component) {
    return class extends React.Component {
        constructor(props) {
            super(props);

            this.state = {
                isActive: Boolean(props.isActive)
            };
        }

        toggle = () => {
            this.setState({ isActive: !this.state.isActive });
        };

        render() {
            const { isActive, ...passProps } = this.props;
            return (
                <Component
                    toggle={this.toggle}
                    {...this.state}
                    {...passProps}
                />
            );
        }
    };
}
